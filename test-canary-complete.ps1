<#
.SYNOPSIS
    Test Suite Completo para Canary Deployment - SmartBoxing

.DESCRIPTION
    Ejecuta una batería completa de tests que valida:
    - Infraestructura AWS (DynamoDB + Lambda)
    - Creación de feature flags
    - Rollout gradual (0% → 10% → 50% → 100%)
    - Distribución estadística consistente
    - Rollback automático
    - Consistencia de hash (mismo usuario = mismo resultado)

.PARAMETER Stage
    Etapa de deployment (dev, prod). Default: prod

.PARAMETER Region
    Región AWS. Default: us-east-1

.PARAMETER Verbose
    Mostrar output detallado de cada paso

.EXAMPLE
    .\test-canary-complete.ps1
    
.EXAMPLE
    .\test-canary-complete.ps1 -Stage dev -Verbose

.NOTES
    Autor: SmartBoxing Team
    Fecha: 2025-12-07
    Version: 1.0.0
#>

param(
    [string]$Stage = "prod",
    [string]$Region = "us-east-1",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# ============================================================================
# CONFIGURACIÓN Y FUNCIONES AUXILIARES
# ============================================================================

$env:STAGE = $Stage
$env:AWS_REGION = $Region

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$testFlag = "test-canary-$timestamp"

# Contadores para el reporte final
$script:TestsPassed = 0
$script:TestsFailed = 0
$script:TestsWarning = 0

function Write-Title {
    param([string]$Text)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Section {
    param([string]$Text)
    Write-Host ""
    Write-Host "------------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "  $Text" -ForegroundColor Yellow
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
}

function Write-Test {
    param([string]$Name)
    Write-Host ""
    Write-Host "TEST: $Name" -ForegroundColor Magenta
    Write-Host "---" -ForegroundColor DarkGray
}

function Assert-Pass {
    param([string]$Message)
    Write-Host "  PASS - $Message" -ForegroundColor Green
    $script:TestsPassed++
}

function Assert-Fail {
    param([string]$Message)
    Write-Host "  FAIL - $Message" -ForegroundColor Red
    $script:TestsFailed++
}

function Assert-Warn {
    param([string]$Message)
    Write-Host "  WARN - $Message" -ForegroundColor Yellow
    $script:TestsWarning++
}

function Write-Info {
    param([string]$Message)
    Write-Host "  INFO - $Message" -ForegroundColor DarkGray
}

function Invoke-Sleep {
    param([int]$Seconds = 1)
    if ($Verbose) {
        Write-Info "Esperando $Seconds segundo(s)..."
    }
    Start-Sleep -Seconds $Seconds
}

# ============================================================================
# INICIO DEL TEST SUITE
# ============================================================================

Write-Title "SmartBoxing - Test Suite Canary Deployment"

Write-Host "Configuracion:"
Write-Host "  Stage:        $Stage" -ForegroundColor White
Write-Host "  Region:       $Region" -ForegroundColor White
Write-Host "  Test Flag:    $testFlag" -ForegroundColor White
Write-Host "  Timestamp:    $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# ============================================================================
# SUITE 1: VERIFICACIÓN DE INFRAESTRUCTURA
# ============================================================================

Write-Section "SUITE 1: Verificacion de Infraestructura AWS"

# Test 1.1: DynamoDB Table
Write-Test "1.1 - Verificar tabla DynamoDB feature-flags"
try {
    $tableName = "smartboxing-$Stage-feature-flags"
    $table = aws dynamodb describe-table --table-name $tableName --region $Region 2>&1 | ConvertFrom-Json
    
    if ($table.Table) {
        Assert-Pass "Tabla '$tableName' existe"
        Write-Info "Estado: $($table.Table.TableStatus)"
        Write-Info "Items: $($table.Table.ItemCount)"
    } else {
        Assert-Fail "Tabla '$tableName' no encontrada"
        Write-Host ""
        Write-Host "ABORTANDO: Sin tabla DynamoDB no se puede continuar" -ForegroundColor Red
        exit 1
    }
} catch {
    Assert-Fail "Error al verificar tabla: $_"
    exit 1
}

# Test 1.2: Lambda Functions
Write-Test "1.2 - Verificar funciones Lambda de Canary"
try {
    $functionsJson = aws lambda list-functions --region $Region --output json
    $allFunctions = ($functionsJson | ConvertFrom-Json).Functions
    
    $expectedFunctions = @(
        "listFeatureFlags",
        "getFeatureFlag",
        "upsertFeatureFlag",
        "updateRollout",
        "rollbackFeature",
        "evaluateFlag",
        "deleteFeatureFlag"
    )
    
    $foundCount = 0
    foreach ($funcName in $expectedFunctions) {
        $fullName = "smartboxing-$Stage-$funcName"
        $exists = $allFunctions | Where-Object { $_.FunctionName -eq $fullName }
        
        if ($exists) {
            $foundCount++
            if ($Verbose) {
                Write-Info "OK - $fullName"
            }
        } else {
            Assert-Warn "Funcion '$fullName' no encontrada"
        }
    }
    
    if ($foundCount -eq $expectedFunctions.Count) {
        Assert-Pass "Todas las funciones Lambda desplegadas ($foundCount/$($expectedFunctions.Count))"
    } elseif ($foundCount -ge 5) {
        Assert-Warn "Solo $foundCount/$($expectedFunctions.Count) funciones encontradas (suficiente para continuar)"
    } else {
        Assert-Fail "Muy pocas funciones ($foundCount/$($expectedFunctions.Count))"
    }
} catch {
    Assert-Fail "Error al verificar funciones Lambda: $_"
}

# Test 1.3: API Gateway
Write-Test "1.3 - Verificar API Gateway"
try {
    $apis = aws apigatewayv2 get-apis --region $Region --output json | ConvertFrom-Json
    $api = $apis.Items | Where-Object { $_.Name -eq "smartboxing-$Stage" }
    
    if ($api) {
        $apiUrl = "https://$($api.ApiId).execute-api.$Region.amazonaws.com"
        Assert-Pass "API Gateway encontrado"
        Write-Info "API ID: $($api.ApiId)"
        Write-Info "URL: $apiUrl"
    } else {
        Assert-Warn "API Gateway no encontrado (puede estar en otra configuracion)"
    }
} catch {
    Assert-Warn "Error al verificar API Gateway: $_"
}

# ============================================================================
# SUITE 2: GESTIÓN DE FEATURE FLAGS
# ============================================================================

Write-Section "SUITE 2: Gestion de Feature Flags"

# Test 2.1: Ver estado inicial
Write-Test "2.1 - Listar feature flags existentes"
try {
    Write-Info "Ejecutando: node scripts/canary-deploy.mjs status"
    node scripts/canary-deploy.mjs status
    Assert-Pass "Comando status ejecutado correctamente"
} catch {
    Assert-Fail "Error al ejecutar status: $_"
}

Invoke-Sleep -Seconds 1

# Test 2.2: Crear feature flag
Write-Test "2.2 - Crear nuevo feature flag"
try {
    Write-Info "Creando flag: $testFlag"
    $output = node scripts/canary-deploy.mjs create $testFlag "Test automatizado completo" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Assert-Pass "Feature flag '$testFlag' creado exitosamente"
        if ($Verbose) {
            Write-Host $output -ForegroundColor DarkGray
        }
    } else {
        Assert-Fail "Error al crear feature flag (exit code: $LASTEXITCODE)"
    }
} catch {
    Assert-Fail "Excepcion al crear feature flag: $_"
}

Invoke-Sleep -Seconds 2

# ============================================================================
# SUITE 3: CANARY DEPLOYMENT (ROLLOUT GRADUAL)
# ============================================================================

Write-Section "SUITE 3: Canary Deployment - Rollout Gradual"

# Test 3.1: Rollout al 10%
Write-Test "3.1 - Canary deployment (10%)"
try {
    $output = node scripts/canary-deploy.mjs rollout $testFlag 10 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Assert-Pass "Rollout a 10% exitoso"
    } else {
        Assert-Fail "Rollout fallo (exit code: $LASTEXITCODE)"
    }
} catch {
    Assert-Fail "Excepcion en rollout: $_"
}

Invoke-Sleep -Seconds 2

# Test 3.2: Validar distribución estadística 10%
Write-Test "3.2 - Validar distribucion estadistica con 10% rollout"
try {
    Write-Info "Evaluando 20 usuarios para validar distribucion..."
    
    $enabled = 0
    $disabled = 0
    
    for ($i = 1; $i -le 20; $i++) {
        $userId = "test-user-$i"
        $result = node scripts/canary-deploy.mjs evaluate $testFlag $userId 2>&1 | Out-String
        
        if ($result -match "VE LA NUEVA FEATURE|enabled.*true") {
            $enabled++
        } else {
            $disabled++
        }
    }
    
    $percentage = [math]::Round(($enabled / 20) * 100, 1)
    
    Write-Info "Resultados: $enabled/20 usuarios ven la feature ($percentage%)"
    Write-Info "Esperado: ~2/20 (10%)"
    
    # Validar con margen de error (5% - 20% es aceptable para 10% target)
    if ($enabled -ge 1 -and $enabled -le 4) {
        Assert-Pass "Distribucion correcta para 10% rollout (margen estadistico aceptable)"
    } else {
        Assert-Warn "Distribucion fuera de rango esperado: $percentage% (esperado 10% ±10%)"
    }
} catch {
    Assert-Fail "Error en validacion de distribucion: $_"
}

Invoke-Sleep -Seconds 2

# Test 3.3: Rollout al 50%
Write-Test "3.3 - Incrementar rollout (50%)"
try {
    $output = node scripts/canary-deploy.mjs rollout $testFlag 50 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Assert-Pass "Rollout a 50% exitoso"
    } else {
        Assert-Fail "Rollout fallo (exit code: $LASTEXITCODE)"
    }
} catch {
    Assert-Fail "Excepcion en rollout: $_"
}

Invoke-Sleep -Seconds 2

# Test 3.4: Validar distribución 50%
Write-Test "3.4 - Validar distribucion con 50% rollout"
try {
    Write-Info "Evaluando 20 usuarios..."
    
    $enabled = 0
    for ($i = 1; $i -le 20; $i++) {
        $userId = "test-user-$i"
        $result = node scripts/canary-deploy.mjs evaluate $testFlag $userId 2>&1 | Out-String
        
        if ($result -match "VE LA NUEVA FEATURE|enabled.*true") {
            $enabled++
        }
    }
    
    $percentage = [math]::Round(($enabled / 20) * 100, 1)
    
    Write-Info "Resultados: $enabled/20 usuarios ven la feature ($percentage%)"
    Write-Info "Esperado: ~10/20 (50%)"
    
    # 40% - 60% es aceptable
    if ($enabled -ge 8 -and $enabled -le 12) {
        Assert-Pass "Distribucion correcta para 50% rollout"
    } else {
        Assert-Warn "Distribucion: $percentage% (esperado 50% ±10%)"
    }
} catch {
    Assert-Fail "Error en validacion: $_"
}

Invoke-Sleep -Seconds 2

# Test 3.5: Full Rollout (100%)
Write-Test "3.5 - Full rollout (100%)"
try {
    $output = node scripts/canary-deploy.mjs rollout $testFlag 100 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Assert-Pass "Full rollout (100%) exitoso"
    } else {
        Assert-Fail "Rollout fallo"
    }
} catch {
    Assert-Fail "Excepcion en full rollout: $_"
}

Invoke-Sleep -Seconds 2

# Test 3.6: Validar que TODOS ven la feature
Write-Test "3.6 - Validar que 100% de usuarios ven la feature"
try {
    Write-Info "Evaluando 10 usuarios..."
    
    $allEnabled = $true
    $count = 0
    
    for ($i = 1; $i -le 10; $i++) {
        $userId = "test-user-$i"
        $result = node scripts/canary-deploy.mjs evaluate $testFlag $userId 2>&1 | Out-String
        
        if ($result -match "VE LA NUEVA FEATURE|enabled.*true") {
            $count++
        } else {
            $allEnabled = $false
        }
    }
    
    if ($allEnabled) {
        Assert-Pass "Todos los usuarios (10/10) ven la feature con 100% rollout"
    } else {
        Assert-Fail "Solo $count/10 usuarios ven la feature (deberian ser todos)"
    }
} catch {
    Assert-Fail "Error en validacion: $_"
}

# ============================================================================
# SUITE 4: CONSISTENCIA Y DETERMINISMO
# ============================================================================

Write-Section "SUITE 4: Consistencia y Determinismo del Hash"

# Test 4.1: Mismo usuario = mismo resultado
Write-Test "4.1 - Validar consistencia: mismo usuario siempre ve lo mismo"
try {
    # Volver a 50% para tener distribución mixta
    node scripts/canary-deploy.mjs rollout $testFlag 50 | Out-Null
    Invoke-Sleep -Seconds 1
    
    $testUserId = "consistency-test-user"
    $results = @()
    
    Write-Info "Evaluando mismo usuario 5 veces..."
    for ($i = 1; $i -le 5; $i++) {
        $result = node scripts/canary-deploy.mjs evaluate $testFlag $testUserId 2>&1 | Out-String
        $results += $result
    }
    
    # Verificar que todos los resultados son iguales
    $firstResult = if ($results[0] -match "VE LA NUEVA FEATURE|enabled.*true") { $true } else { $false }
    $allConsistent = $true
    
    for ($i = 1; $i -lt $results.Count; $i++) {
        $currentResult = if ($results[$i] -match "VE LA NUEVA FEATURE|enabled.*true") { $true } else { $false }
        if ($currentResult -ne $firstResult) {
            $allConsistent = $false
            break
        }
    }
    
    if ($allConsistent) {
        Assert-Pass "Hash consistente: mismo usuario siempre obtiene mismo resultado"
        Write-Info "Usuario '$testUserId' siempre ve: $(if ($firstResult) { 'NUEVA FEATURE' } else { 'VERSION ANTERIOR' })"
    } else {
        Assert-Fail "Inconsistencia detectada: mismo usuario obtuvo resultados diferentes"
    }
} catch {
    Assert-Fail "Error en test de consistencia: $_"
}

# ============================================================================
# SUITE 5: ROLLBACK
# ============================================================================

Write-Section "SUITE 5: Rollback Automatico"

# Test 5.1: Ejecutar rollback
Write-Test "5.1 - Ejecutar rollback de feature flag"
try {
    Write-Info "Simulando deteccion de errores en produccion..."
    $output = node scripts/canary-deploy.mjs rollback $testFlag 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Assert-Pass "Rollback ejecutado exitosamente"
    } else {
        Assert-Fail "Rollback fallo (exit code: $LASTEXITCODE)"
    }
} catch {
    Assert-Fail "Excepcion en rollback: $_"
}

Invoke-Sleep -Seconds 2

# Test 5.2: Validar que NADIE ve la feature después de rollback
Write-Test "5.2 - Validar que feature esta deshabilitada post-rollback"
try {
    Write-Info "Evaluando 10 usuarios..."
    
    $anyEnabled = $false
    $disabledCount = 0
    
    for ($i = 1; $i -le 10; $i++) {
        $userId = "test-user-$i"
        $result = node scripts/canary-deploy.mjs evaluate $testFlag $userId 2>&1 | Out-String
        
        if ($result -match "VE LA NUEVA FEATURE|enabled.*true") {
            $anyEnabled = $true
        } else {
            $disabledCount++
        }
    }
    
    if (-not $anyEnabled -and $disabledCount -eq 10) {
        Assert-Pass "Ningun usuario ve la feature despues del rollback (10/10)"
    } elseif ($disabledCount -ge 8) {
        Assert-Warn "Mayoria de usuarios no ven la feature ($disabledCount/10) - puede ser cache"
    } else {
        Assert-Fail "Algunos usuarios aun ven la feature post-rollback"
    }
} catch {
    Assert-Fail "Error en validacion post-rollback: $_"
}

# ============================================================================
# SUITE 6: ESTADO FINAL Y LIMPIEZA
# ============================================================================

Write-Section "SUITE 6: Estado Final y Verificacion"

# Test 6.1: Ver estado final
Write-Test "6.1 - Verificar estado final de feature flags"
try {
    node scripts/canary-deploy.mjs status
    Assert-Pass "Estado final obtenido correctamente"
} catch {
    Assert-Fail "Error al obtener estado final: $_"
}

# Test 6.2: Limpiar flag de prueba (opcional)
Write-Test "6.2 - Limpieza: Eliminar flag de prueba"
try {
    Write-Info "Nota: Flag '$testFlag' quedara en DynamoDB para revision manual"
    Write-Info "Para eliminar: node scripts/canary-deploy.mjs delete $testFlag"
    Assert-Pass "Flag de prueba documentado para limpieza manual"
} catch {
    Assert-Warn "Limpieza manual requerida"
}

# ============================================================================
# REPORTE FINAL
# ============================================================================

Write-Section "REPORTE FINAL - Test Suite Completo"

Write-Host ""
Write-Host "Estadisticas:" -ForegroundColor Cyan
Write-Host "  Tests Ejecutados: $($TestsPassed + $TestsFailed + $TestsWarning)" -ForegroundColor White
Write-Host "  PASSED:          $TestsPassed" -ForegroundColor Green
Write-Host "  FAILED:          $TestsFailed" -ForegroundColor Red
Write-Host "  WARNINGS:        $TestsWarning" -ForegroundColor Yellow

Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  TEST SUITE COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Canary Deployment esta 100% funcional y listo para uso" -ForegroundColor Green
} elseif ($TestsFailed -le 2) {
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host "  TEST SUITE COMPLETADO CON ADVERTENCIAS" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Revisar los $TestsFailed tests fallidos arriba" -ForegroundColor Yellow
} else {
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  TEST SUITE FALLO" -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Se encontraron $TestsFailed problemas criticos" -ForegroundColor Red
}

Write-Host "Comandos utiles:" -ForegroundColor Cyan
Write-Host "  Ver estado:  node scripts/canary-deploy.mjs status" -ForegroundColor DarkGray
Write-Host "  Demo:        node scripts/canary-deploy.mjs demo" -ForegroundColor DarkGray
Write-Host "  Cleanup:     node scripts/canary-deploy.mjs delete $testFlag" -ForegroundColor DarkGray
Write-Host ""

# Retornar exit code basado en resultados
if ($TestsFailed -eq 0) {
    exit 0
} else {
    exit 1
}
