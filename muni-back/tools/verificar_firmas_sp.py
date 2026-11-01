#!/usr/bin/env python3
"""Verificación estática muni-back vs MunicipalidadNicoya2026 (T-SQL).
1) Cada llamada "dbo.sp_x" en Services: SP existe, parámetros existen, obligatorios presentes,
   OUTPUT coincide, tamaños VARCHAR y tipos coinciden.
2) Cada DTO/vista: columnas C# == columnas del SELECT real (nombres)."""
import json, re, sys, glob, os

SQL_FILES = sys.argv[1:-2]
SERVICES = sys.argv[-2]
COLS_JSON = sys.argv[-1]

sql = ""
for f in SQL_FILES:
    sql += open(f, encoding="utf-8-sig").read() + "\nGO\n"
sql_nc = re.sub(r"--[^\n]*", "", sql)
sql_nc = re.sub(r"/\*.*?\*/", "", sql_nc, flags=re.S)

# ---------- 1. firmas de SP ----------
procs = {}
bodies = {}
for m in re.finditer(r"CREATE\s+OR\s+ALTER\s+PROCEDURE\s+dbo\.(\w+)(.*?)\bAS\b\s*BEGIN(.*?)\nGO\b", sql_nc, re.S | re.I):
    name, sig, body = m.group(1), m.group(2), m.group(3)
    params = {}
    for p in re.finditer(r"(@\w+)\s+([A-Z]+(?:\s*\(\s*(?:\d+|MAX)(?:\s*,\s*\d+)?\s*\))?)\s*(=\s*[^,\n]+)?\s*(OUTPUT)?", sig, re.I):
        pname, ptype, dflt, out = p.groups()
        if dflt and re.search(r"OUTPUT", dflt, re.I):
            out = "OUTPUT"; dflt = dflt.replace("OUTPUT", "")
        params[pname.lower()] = dict(type=re.sub(r"\s+", "", ptype.upper()), default=bool(dflt), output=bool(out))
    procs[name.lower()] = params
    bodies[name.lower()] = body

TYPE_MAP = {"Int": "INT", "BigInt": "BIGINT", "Float": "FLOAT", "Bit": "BIT", "DateTime": "DATETIME",
            "Time": "TIME", "VarChar": "VARCHAR", "OutInt": "INT"}

errors, ok_calls = [], 0
cs_files = glob.glob(os.path.join(SERVICES, "**", "*.cs"), recursive=True)
used_sps = set()
for f in cs_files:
    src = open(f, encoding="utf-8").read()
    for m in re.finditer(r'"dbo\.(sp_\w+)"', src):
        sp = m.group(1).lower()
        used_sps.add(sp)
        # Texto de la llamada: hasta el ';' que cierra la sentencia
        seg = src[m.end(): src.find(";", m.end())]
        calls = re.findall(r"Sp\.(\w+)\(\s*\"(@\w+)\"(?:\s*,\s*[^,()]+(?:\([^()]*\))?)?(?:\s*,\s*([\w.]+))?", seg)
        rel = os.path.relpath(f, SERVICES)
        if sp not in procs:
            errors.append(f"{rel}: {sp} NO existe en la BD"); continue
        sig = procs[sp]
        passed = {}
        for kind, pname, size in calls:
            passed[pname.lower()] = (kind, size)
        # Llamadas con parámetros construidos aparte (listas / helpers)
        extra = {
            "sp_calcular_recargos_intereses": {"@id_deuda_municipal": ("Int", ""), "@tasa_interes_mensual": ("Float", "")},
            "sp_dba_ejecutar_backup_full": {"@ruta_carpeta": ("VarChar", "200")},
            "sp_dba_ejecutar_backup_diferencial": {"@ruta_carpeta": ("VarChar", "200")},
            "sp_reporte_gestion_municipal": {"@tipo_reporte": ("VarChar", "50"), "@filtro_texto": ("VarChar", "100")},
        }.get(sp)
        if extra and not passed:
            passed = extra
        for pname, (kind, size) in passed.items():
            if pname not in sig:
                errors.append(f"{rel}: {sp} no tiene el parámetro {pname}"); continue
            exp = sig[pname]
            base = re.match(r"[A-Z]+", exp["type"]).group(0)
            if TYPE_MAP.get(kind) != base:
                errors.append(f"{rel}: {sp} {pname} tipo C# {kind} vs SQL {exp['type']}")
            if kind == "VarChar":
                msize = re.search(r"\((\d+|MAX)\)", exp["type"])
                want = msize.group(1) if msize else "1"
                got = {"Sp.Max": "MAX"}.get(size, size)
                if want != got:
                    errors.append(f"{rel}: {sp} {pname} VARCHAR({got}) vs SQL {exp['type']}")
            if (kind == "OutInt") != exp["output"]:
                errors.append(f"{rel}: {sp} {pname} OUTPUT no coincide")
        for pname, exp in sig.items():
            if pname not in passed and not exp["default"]:
                errors.append(f"{rel}: {sp} falta el parámetro obligatorio {pname}")
        ok_calls += 1

# ---------- 2. columnas ----------
def split_top(s):
    out, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(": depth += 1
        if ch == ")": depth -= 1
        if ch == "," and depth == 0:
            out.append(cur); cur = ""
        else:
            cur += ch
    out.append(cur)
    return [x.strip() for x in out if x.strip()]

tables = {}
for m in re.finditer(r"CREATE\s+TABLE\s+(?:dbo\.)?(\w+)\s*\((.*?)\)\s*ON\s", sql_nc, re.S | re.I):
    cols = []
    for line in split_top(m.group(2)):
        w = line.split()
        if w and not w[0].upper() == "CONSTRAINT":
            cols.append(w[0])
    tables[m.group(1).lower()] = cols

def select_cols(body, aliases):
    ms = [m for m in re.finditer(r"SELECT\s+(?:TOP\s+\d+\s+)?(.*?)\s+FROM\s+(.*?)(?:\bWHERE\b|\bGROUP\b|\bORDER\b|;|$)", body, re.S | re.I)
          if not m.group(1).lstrip().startswith("@") and not re.match(r"\s*1\s*$", m.group(1))]
    m = ms[-1] if ms else None
    sel, frm = m.group(1), m.group(2)
    amap = {}
    for t in re.finditer(r"(?:dbo\.)?(\w+)\s+(?:AS\s+)?(\w+)\s*(?:INNER|LEFT|RIGHT|CROSS|ON|$)", frm + " ", re.I):
        amap[t.group(2).lower()] = t.group(1).lower()
    first = re.match(r"\s*(?:dbo\.)?(\w+)(?:\s+(\w+))?", frm)
    cols = []
    for item in split_top(sel):
        if item == "*":
            src = first.group(1).lower()
            cols += views.get(src) or tables[src]
        elif item.endswith(".*"):
            al = item[:-2].lower()
            cols += tables[amap.get(al, al)]
        else:
            a = re.search(r"\bAS\s+(\w+)\s*$", item, re.I)
            cols.append(a.group(1) if a else item.split(".")[-1].strip())
    return cols

views = {}
for m in re.finditer(r"CREATE\s+OR\s+ALTER\s+VIEW\s+dbo\.(\w+)\s+AS\s+(.*?)\nGO\b", sql_nc, re.S | re.I):
    views[m.group(1).lower()] = select_cols(m.group(2), {})

spec = json.load(open(COLS_JSON))
col_ok = 0
for cls, (view, cols) in spec["views"].items():
    real = views[view.lower()]
    if [c.lower() for c in real] != [c.lower() for c in cols]:
        errors.append(f"Vista {view}: C#={cols} SQL={real}")
    else:
        col_ok += 1
for cls, (sp, cols) in spec["sp"].items():
    body = bodies.get(sp.lower())
    if body is None:
        errors.append(f"{cls}: SP {sp} no existe"); continue
    real = select_cols(body, {})
    missing = [c for c in cols if c.lower() not in [r.lower() for r in real]]
    if missing:
        errors.append(f"{cls} ({sp}): columnas inexistentes en el recordset: {missing} | SQL={real}")
    else:
        col_ok += 1

catalog = set(json.load(open(os.path.join(os.path.dirname(COLS_JSON), "catalogo_spec.json"))))
not_used = sorted(catalog - used_sps)

print(f"Llamadas a SP verificadas: {ok_calls}  | SP distintos usados: {len(used_sps)}")
print(f"Modelos de columnas verificados: {col_ok}/{len(spec['views']) + len(spec['sp'])}")
print(f"SP del catálogo de la especificación sin uso: {not_used or 'ninguno'}")
print("ERRORES:" if errors else "SIN ERRORES")
for e in errors:
    print("  -", e)
sys.exit(1 if errors else 0)
