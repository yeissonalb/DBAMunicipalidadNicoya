using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MunicipalidadAPI.Middlewares;
using MunicipalidadAPI.Seguridad;
using Services.Auth;
using Services.AuditoriaService;
using Services.CatalogosGeneralesService;
using Services.CatalogosInmuebleService;
using Services.Common;
using Services.ContribuyenteService;
using Services.FacturacionPagoService;
using Services.genericResponse;
using Services.InmuebleService;
using Services.MyDbContext;
using Services.ReportesService;
using Services.RespaldosDbaService;
using Services.RolPermisoService;
using Services.TipoTramiteService;
using Services.TramiteService;
using Services.TributoDeudaService;
using Services.UsuarioService;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------------------
// Base de datos: solo vistas (lectura) + ejecución de procedimientos almacenados
// ---------------------------------------------------------------------------
// El interceptor envía el id_usuario del JWT con sp_set_session_context en cada comando,
// para que los triggers de auditoría registren al funcionario real (requiere script 14).
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<ICurrentUserAccessor, HttpContextCurrentUserAccessor>();
builder.Services.AddSingleton<SessionContextInterceptor>();

builder.Services.AddDbContext<MunicipalidadContext>((sp, options) =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .AddInterceptors(sp.GetRequiredService<SessionContextInterceptor>()));

// ---------------------------------------------------------------------------
// Servicios (Thin Gateway: cada método invoca un dbo.sp_* o lee una dbo.vw_*)
// ---------------------------------------------------------------------------
builder.Services.AddScoped<ISvAuth, SvAuth>();
builder.Services.AddScoped<ISvUsuario, SvUsuario>();
builder.Services.AddScoped<ISvRolPermiso, SvRolPermiso>();
builder.Services.AddScoped<ISvContribuyente, SvContribuyente>();
builder.Services.AddScoped<ISvInmueble, SvInmueble>();
builder.Services.AddScoped<ISvCatalogosInmueble, SvCatalogosInmueble>();
builder.Services.AddScoped<ISvTipoTramite, SvTipoTramite>();
builder.Services.AddScoped<ISvTramite, SvTramite>();
builder.Services.AddScoped<ISvTributoDeuda, SvTributoDeuda>();
builder.Services.AddScoped<ISvFacturacionPago, SvFacturacionPago>();
builder.Services.AddScoped<ISvReportes, SvReportes>();
builder.Services.AddScoped<ISvAuditoria, SvAuditoria>();
builder.Services.AddScoped<ISvRespaldosDba, SvRespaldosDba>();
builder.Services.AddScoped<ISvCatalogosGenerales, SvCatalogosGenerales>();

// ---------------------------------------------------------------------------
// MVC + validación de DTOs con la misma forma BaseResponse<T>
// ---------------------------------------------------------------------------
builder.Services.AddControllers()
    .AddNewtonsoftJson()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errores = context.ModelState
                .Where(kv => kv.Value?.Errors.Count > 0)
                .ToDictionary(
                    kv => kv.Key,
                    kv => kv.Value!.Errors.Select(e => string.IsNullOrEmpty(e.ErrorMessage) ? "Valor inválido." : e.ErrorMessage).ToArray());

            return new BadRequestObjectResult(new BaseResponse<object>
            {
                Success = false,
                Message = "Los datos enviados no son válidos.",
                Data = errores
            });
        };
    });

// Subida de archivos (GTA): límite del cuerpo multipart
builder.Services.Configure<FormOptions>(o => o.MultipartBodyLengthLimit = ArchivoTramitePolicy.MaxBytes + 1024 * 1024);

// ---------------------------------------------------------------------------
// Autenticación JWT
// ---------------------------------------------------------------------------
var jwtKey = builder.Configuration["Jwt:Key"]
             ?? throw new InvalidOperationException("Falta la configuración Jwt:Key.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var authHeader = context.Request.Headers.Authorization.ToString();
                if (!string.IsNullOrWhiteSpace(authHeader))
                {
                    var cleaned = authHeader.Trim();
                    while (cleaned.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                        cleaned = cleaned["Bearer ".Length..].Trim();
                    cleaned = cleaned.Trim('"', '\'');
                    if (!string.IsNullOrWhiteSpace(cleaned))
                        context.Token = cleaned;
                }
                else if (context.Request.Cookies.TryGetValue("jwt_token", out var cookieToken)
                         && !string.IsNullOrWhiteSpace(cookieToken))
                {
                    context.Token = cookieToken.Trim('"', '\'');
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ---------------------------------------------------------------------------
// CORS para el frontend React (CRA :3000 y Vite :5173)
// ---------------------------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy => policy
        .WithOrigins("http://localhost:3000", "http://localhost:5173")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// ---------------------------------------------------------------------------
// Swagger con soporte para Bearer
// ---------------------------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Municipalidad de Nicoya 2026 - API",
        Version = "v1",
        Description = "Thin Gateway: toda la lógica de negocio reside en SQL Server (dbo.sp_*, dbo.vw_*)."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Pegue solo el token devuelto por POST /api/auth/login."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });

    var xml = Path.Combine(AppContext.BaseDirectory, $"{typeof(Program).Assembly.GetName().Name}.xml");
    if (File.Exists(xml)) c.IncludeXmlComments(xml);
});

var app = builder.Build();

// Garantiza que exista wwwroot/uploads/tramites antes de servir archivos estáticos
var webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "tramites"));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Municipalidad Nicoya 2026 v1");
        c.EnablePersistAuthorization();
        c.UseResponseInterceptor("function(res) { if (res.url && res.url.indexOf('/api/auth/login') !== -1 && res.status === 200) { try { var obj = JSON.parse(res.text); var tok = obj && obj.data && obj.data.token; if (tok && window.ui) { window.ui.preauthorizeApiKey('Bearer', tok); } } catch(e){} } return res; }");
    });
}

app.UseStaticFiles();                              // sirve wwwroot/uploads/...
app.UseCors("ReactApp");
app.UseMiddleware<SqlExceptionMiddleware>();       // THROW 50XXX -> HTTP (después de CORS para conservar encabezados)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
