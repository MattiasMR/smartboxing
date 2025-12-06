# 🧪 Guía de Testing - Canary Deployment

Esta guía proporciona procedimientos detallados para validar el sistema de canary deployment implementado en SmartBoxing.

---

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Test 1: Deploy Normal a Development](#test-1-deploy-normal-a-development)
3. [Test 2: Deploy Canary a Production](#test-2-deploy-canary-a-production)
4. [Test 3: Rollback Automático](#test-3-rollback-automático)
5. [Test 4: Monitoreo en Tiempo Real](#test-4-monitoreo-en-tiempo-real)
6. [Test 5: Notificaciones SNS](#test-5-notificaciones-sns)
7. [Troubleshooting](#troubleshooting)
8. [Checklist de Validación](#checklist-de-validación)

---

## Pre-requisitos

Antes de ejecutar los tests, asegúrate de tener:

- ✅ **AWS CLI** configurado con credenciales válidas
- ✅ **Node.js 22+** instalado
- ✅ **Git** con acceso al repositorio
- ✅ **Permisos AWS** para Lambda, CodeDeploy, CloudWatch
- ✅ **Email confirmado** en SNS (milan.munoz@udd.cl para prod)
- ✅ **Rama `milan`** actualizada con todas las fases

### Verificar Pre-requisitos

```bash
# Verificar Node.js
node --version  # Debe ser v22.x.x

# Verificar AWS CLI y credenciales
aws sts get-caller-identity

# Verificar que estás en la rama correcta
git branch --show-current  # Debe ser 'milan'

# Verificar que los scripts existen
ls scripts/canary-monitor.mjs
ls scripts/test-canary-rollback.mjs
```

---

## Test 1: Deploy Normal a Development

**Objetivo:** Validar que el deploy automático a `dev` funciona sin canary deployment.

### Procedimiento

1. **Hacer un cambio mínimo en el código**

```bash
cd backend/src/handlers
# Editar health.js para agregar un comentario o cambiar un log
```

2. **Commit y push a main**

```bash
git add .
git commit -m "test: validate dev deployment workflow"
git push origin milan:main
```

3. **Monitorear GitHub Actions**

- Ir a: `https://github.com/MattiasMR/smartboxing/actions`
- Verificar que el workflow "🚀 Deploy SmartBoxing" se ejecuta
- Confirmar que solo se ejecuta el job `deploy-dev`

4. **Validar el deployment**

```bash
# Verificar que el stack se actualizó
aws cloudformation describe-stacks --stack-name smartboxing-dev \
  --query 'Stacks[0].{Status:StackStatus,Updated:LastUpdatedTime}' \
  --output table

# Verificar función Lambda
aws lambda get-function --function-name smartboxing-dev-health \
  --query 'Configuration.{Version:Version,Updated:LastModified}' \
  --output table

# Test del endpoint
curl https://7dkjmfntz3.execute-api.us-east-1.amazonaws.com/health
```

### Resultado Esperado

- ✅ Workflow completa en ~5-8 minutos
- ✅ Solo job `deploy-dev` se ejecuta (no `deploy-prod-canary`)
- ✅ Stack CloudFormation actualizado
- ✅ Función Lambda tiene nueva versión
- ✅ Endpoint responde correctamente
- ✅ **NO hay deployment canary** (deploy directo)

### Captura de Evidencia

```bash
# Screenshot 1: GitHub Actions workflow execution
# Screenshot 2: CloudFormation stack status
# Screenshot 3: Lambda function updated version
# Screenshot 4: Endpoint health check response
```

---

## Test 2: Deploy Canary a Production

**Objetivo:** Validar el canary deployment progresivo en producción (10% → 50% → 100%).

### Procedimiento

1. **Ejecutar deployment manual**

- Ir a: `https://github.com/MattiasMR/smartboxing/actions`
- Click en "🚀 Deploy SmartBoxing"
- Click en "Run workflow"
- Seleccionar:
  - Branch: `milan`
  - Stage: `prod`
- Click en "Run workflow"

2. **Aprobar el deployment** (si está configurado)

- Esperar a que aparezca el botón "Review deployments"
- Click en "Review deployments"
- Seleccionar "production"
- Click en "Approve and deploy"

3. **Monitorear el progreso**

```bash
# En una terminal, ejecutar el monitor
node scripts/canary-monitor.mjs --stage=prod --timeout=25

# Salida esperada:
# 🐤 Canary Deployment Monitor
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# 📊 Estado: InProgress
# 🕐 Tiempo transcurrido: 00:02:15
# 
# Timeline (Canary10Percent5Minutes):
#   10% ████████░░░░░░░░░░░░░░░░░░░░ (2m 15s / 5m)
#   50% ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (esperando...)
#  100% ░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (esperando...)
```

4. **Verificar métricas en CloudWatch**

```bash
# Abrir CloudWatch Console
# https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:

# Verificar que las alarmas están en estado OK:
# - smartboxing-prod-CanaryErrorAlarm
# - smartboxing-prod-CanaryLatencyAlarm
# - smartboxing-prod-CanaryThrottleAlarm
```

5. **Validar progresión de tráfico**

```bash
# Verificar alias 'live' apuntando a la versión canary
aws lambda get-alias \
  --function-name smartboxing-prod-listBoxes \
  --name live \
  --query '{Version:FunctionVersion,Weights:RoutingConfig.AdditionalVersionWeights}' \
  --output table

# Durante el 10%: verás weights con 90% en versión anterior, 10% en nueva
# Durante el 50%: verás weights con 50% en cada versión
# Al 100%: alias apunta 100% a la nueva versión
```

### Resultado Esperado

- ✅ Workflow `deploy-prod-canary` se ejecuta
- ✅ Monitoreo muestra progresión: 10% (5min) → 50% (10min) → 100%
- ✅ CloudWatch Alarms permanecen en estado OK
- ✅ Deployment completa en ~20-22 minutos
- ✅ Email de SNS notifica deployment exitoso
- ✅ Funciones Lambda tienen alias `live` actualizado

### Captura de Evidencia

```bash
# Screenshot 1: GitHub Actions manual trigger
# Screenshot 2: Approval step (si aplica)
# Screenshot 3: Monitor output showing 10% → 50% → 100%
# Screenshot 4: CloudWatch Alarms all OK
# Screenshot 5: Lambda alias weights during canary
# Screenshot 6: SNS email notification
```

---

## Test 3: Rollback Automático

**Objetivo:** Validar que CodeDeploy ejecuta rollback automático cuando se disparan CloudWatch Alarms.

### ⚠️ IMPORTANTE

Este test **inducirá fallos intencionalmente** en funciones Lambda. Ejecutar solo en ambiente de pruebas o en horarios de bajo tráfico.

### Procedimiento

#### Opción A: Test de Error Rate Alarm

1. **Preparar el test**

```bash
# Verificar que la función existe
aws lambda get-function --function-name smartboxing-prod-listBoxes

# Verificar estado de alarmas (deben estar OK)
aws cloudwatch describe-alarms \
  --alarm-names smartboxing-prod-CanaryErrorAlarm \
  --query 'MetricAlarms[0].StateValue'
```

2. **Iniciar un canary deployment**

```bash
# Hacer un cambio trivial y deployar a prod
# (seguir pasos del Test 2)
```

3. **Inducir errores durante el canary**

```bash
# Esperar a que el canary esté en 10% o 50%
# Luego ejecutar el script de test

node scripts/test-canary-rollback.mjs \
  --scenario=errors \
  --function=listBoxes \
  --stage=prod \
  --iterations=10

# El script:
# - Activa chaos mode en la función
# - Invoca la función 10 veces
# - Genera errores en >50% de las invocaciones
# - Verifica el estado de las alarmas
# - Desactiva chaos mode automáticamente
```

4. **Monitorear el rollback**

```bash
# En otra terminal, seguir monitoreando
node scripts/canary-monitor.mjs --stage=prod

# Salida esperada cuando se detecta fallo:
# 🐤 Canary Deployment Monitor
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 
# ⚠️  ALARMA DISPARADA: CanaryErrorAlarm
# 🔄 CodeDeploy iniciando rollback...
# 
# 📊 Estado: Failed
# 🕐 Tiempo transcurrido: 00:03:45
# ❌ Deployment falló - Rollback ejecutado
```

5. **Verificar el rollback**

```bash
# Verificar que el alias volvió a la versión anterior
aws lambda get-alias \
  --function-name smartboxing-prod-listBoxes \
  --name live

# Verificar estado de la alarma
aws cloudwatch describe-alarms \
  --alarm-names smartboxing-prod-CanaryErrorAlarm \
  --query 'MetricAlarms[0].{State:StateValue,Reason:StateReason}'

# Verificar deployment en CodeDeploy
aws deploy list-deployments \
  --application-name smartboxing-prod \
  --deployment-group-name smartboxing-prod-deployment-group \
  --max-items 1
```

#### Opción B: Test de Latency Alarm

```bash
node scripts/test-canary-rollback.mjs \
  --scenario=latency \
  --function=getBox \
  --stage=prod \
  --iterations=15
```

#### Opción C: Test de Throttle Alarm

```bash
node scripts/test-canary-rollback.mjs \
  --scenario=throttle \
  --function=createBox \
  --stage=prod \
  --iterations=20
```

### Resultado Esperado

- ✅ Script genera errores/latencia/throttles exitosamente
- ✅ CloudWatch Alarm pasa de OK → ALARM (2-3 minutos)
- ✅ CodeDeploy detecta alarma y cancela deployment
- ✅ Tráfico vuelve 100% a versión anterior (rollback)
- ✅ Email SNS notifica el rollback
- ✅ Monitor muestra estado "Failed" o "Stopped"
- ✅ Chaos mode se desactiva automáticamente

### Captura de Evidencia

```bash
# Screenshot 1: Script output showing errors being generated
# Screenshot 2: CloudWatch Alarm in ALARM state
# Screenshot 3: CodeDeploy showing rollback in progress
# Screenshot 4: Monitor showing deployment failed
# Screenshot 5: Lambda alias back to previous version
# Screenshot 6: SNS email about rollback
```

---

## Test 4: Monitoreo en Tiempo Real

**Objetivo:** Validar que el script de monitoreo proporciona visibilidad correcta del deployment.

### Procedimiento

1. **Ejecutar un deployment canary**

```bash
# Iniciar deployment a prod (ver Test 2)
```

2. **Iniciar monitoreo en paralelo**

```bash
# Terminal 1: Monitor básico
node scripts/canary-monitor.mjs --stage=prod

# Terminal 2: Monitor con timeout custom
node scripts/canary-monitor.mjs --stage=prod --timeout=30
```

3. **Validar output del monitor**

Verificar que el monitor muestra:
- ✅ Estado actual del deployment
- ✅ Tiempo transcurrido
- ✅ Barras de progreso para 10%, 50%, 100%
- ✅ Métricas de CloudWatch (si hay datos)
- ✅ Alarmas activas
- ✅ Actualización cada 30 segundos

4. **Test de timeout**

```bash
# Ejecutar con timeout corto para simular timeout
node scripts/canary-monitor.mjs --stage=prod --timeout=1

# Debe mostrar mensaje de timeout después de 1 minuto
```

### Resultado Esperado

- ✅ Monitor se conecta a AWS sin errores
- ✅ Polling funciona cada 30 segundos
- ✅ Barras de progreso se actualizan correctamente
- ✅ Timeline muestra transiciones (10% → 50% → 100%)
- ✅ Métricas de CloudWatch se visualizan
- ✅ Timeout funciona correctamente

---

## Test 5: Notificaciones SNS

**Objetivo:** Validar que las notificaciones por email funcionan correctamente.

### Procedimiento

1. **Verificar suscripción SNS**

```bash
# Listar suscripciones del topic
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:384722508633:smartboxing-prod-canary-alerts \
  --query 'Subscriptions[*].{Protocol:Protocol,Endpoint:Endpoint,Status:SubscriptionArn}'
```

2. **Verificar email confirmado**

- Check email: milan.munoz@udd.cl
- Debe tener confirmación de SNS subscription
- Si no está confirmado, buscar email "AWS Notification - Subscription Confirmation"

3. **Disparar una alarma manualmente**

```bash
# Cambiar estado de alarma a ALARM (test)
aws cloudwatch set-alarm-state \
  --alarm-name smartboxing-prod-CanaryErrorAlarm \
  --state-value ALARM \
  --state-reason "Test manual de notificaciones"

# Esperar 30-60 segundos
# Verificar email

# Volver alarma a OK
aws cloudwatch set-alarm-state \
  --alarm-name smartboxing-prod-CanaryErrorAlarm \
  --state-value OK \
  --state-reason "Test completado"
```

4. **Ejecutar deployment completo**

```bash
# Deploy canary exitoso → debe enviar email de éxito
# Deploy con rollback → debe enviar email de fallo
```

### Resultado Esperado

- ✅ Suscripción SNS está confirmada
- ✅ Email recibido cuando alarma → ALARM
- ✅ Email recibido cuando alarma → OK
- ✅ Email recibido al completar deployment
- ✅ Email recibido en caso de rollback

---

## Troubleshooting

### Problema: Workflow no se dispara en GitHub Actions

**Síntomas:**
- Push a main no ejecuta deploy-dev
- Manual trigger no muestra workflow

**Soluciones:**
```bash
# Verificar que el archivo workflow existe
ls .github/workflows/deploy.yml

# Verificar sintaxis YAML
cat .github/workflows/deploy.yml | head -20

# Verificar en GitHub que el workflow está habilitado
# Settings → Actions → General → "Allow all actions"
```

### Problema: Canary deployment no progresa

**Síntomas:**
- Monitor muestra "InProgress" indefinidamente
- Deployment se queda en 10%

**Soluciones:**
```bash
# Verificar que los hooks están configurados
aws lambda get-function --function-name smartboxing-prod-preTrafficHook
aws lambda get-function --function-name smartboxing-prod-postTrafficHook

# Ver logs de los hooks
aws logs tail /aws/lambda/smartboxing-prod-preTrafficHook --follow
aws logs tail /aws/lambda/smartboxing-prod-postTrafficHook --follow

# Verificar deployment en CodeDeploy
aws deploy get-deployment --deployment-id <deployment-id>
```

### Problema: Rollback no se ejecuta

**Síntomas:**
- Alarma en ALARM pero deployment continúa
- Errores visibles pero sin rollback

**Soluciones:**
```bash
# Verificar que las alarmas están configuradas en CodeDeploy
aws deploy get-deployment-config \
  --deployment-config-name CodeDeployDefault.LambdaCanary10Percent5Minutes

# Verificar permisos de CodeDeploy
aws iam get-role --role-name CodeDeployServiceRole-smartboxing-prod

# Verificar que la alarma está asociada al deployment group
aws deploy get-deployment-group \
  --application-name smartboxing-prod \
  --deployment-group-name smartboxing-prod-deployment-group \
  --query 'deploymentGroupInfo.alarmConfiguration'
```

### Problema: Monitor no encuentra deployments

**Síntomas:**
```
⏳ Esperando deployment...
No se encontró deployment activo
```

**Soluciones:**
```bash
# Verificar que CodeDeploy Application existe
aws deploy get-application --application-name smartboxing-prod

# Listar deployments recientes
aws deploy list-deployments \
  --application-name smartboxing-prod \
  --max-items 5

# Verificar región correcta
echo $AWS_REGION  # Debe ser us-east-1
```

### Problema: Chaos mode no se desactiva

**Síntomas:**
- Función sigue generando errores después del test
- Variables CHAOS_* permanecen en configuración

**Soluciones:**
```bash
# Desactivar manualmente
node scripts/test-canary-rollback.mjs --scenario=errors --function=listBoxes --stage=prod --iterations=0

# O via AWS CLI
aws lambda update-function-configuration \
  --function-name smartboxing-prod-listBoxes \
  --environment "Variables={}"

# Verificar
aws lambda get-function-configuration \
  --function-name smartboxing-prod-listBoxes \
  --query 'Environment.Variables'
```

---

## Checklist de Validación

### ✅ Fase 4: Testing Completo

- [ ] **Test 1:** Deploy normal a dev ejecutado exitosamente
- [ ] **Test 2:** Deploy canary a prod completado (10% → 50% → 100%)
- [ ] **Test 3:** Rollback automático validado con errores inducidos
- [ ] **Test 4:** Script de monitoreo funciona correctamente
- [ ] **Test 5:** Notificaciones SNS recibidas en email
- [ ] **Screenshots:** Capturados para evidencia académica
- [ ] **Logs:** Guardados de todos los tests

### ✅ Fase 5: Evidencia Académica

- [ ] **EVIDENCIA_CANARY.md:** Documento creado con resultados
- [ ] **Screenshots:** Organizados por test (mínimo 15)
- [ ] **Logs:** Exportados y documentados
- [ ] **Métricas:** CloudWatch metrics capturadas
- [ ] **Comparativa:** Antes/después documentada
- [ ] **Análisis:** Resultados interpretados y conclusiones

### ✅ Entrega Final

- [ ] **README.md:** Actualizado con resultados
- [ ] **estadoCanario.md:** Fases 4-5 marcadas como completadas
- [ ] **Commits:** Todos los cambios committeados
- [ ] **Documentación:** Completa y revisada
- [ ] **Rollback:** Funciones Lambda sin chaos mode activo

---

## 📊 Métricas de Éxito

Un canary deployment exitoso debe cumplir:

| Métrica | Valor Esperado |
|---------|----------------|
| **Tiempo total** | 20-25 minutos |
| **Transición 10%** | ~5 minutos |
| **Transición 50%** | ~10 minutos |
| **Transición 100%** | ~5 minutos |
| **Error Rate** | <5 errores/2min |
| **P99 Latency** | <2000ms |
| **Throttle Rate** | <5 throttles/2min |
| **Rollback Time** | <3 minutos |
| **Email Latency** | <2 minutos |

---

## 🎯 Casos de Uso Recomendados

### Para Desarrollo
- Deploy normal sin canary
- Testing rápido de features
- Iteración continua

### Para Producción
- Deploy canary con validación progresiva
- Rollback automático en caso de issues
- Monitoreo en tiempo real
- Notificaciones por email

### Para Testing
- Validación de rollback automático
- Pruebas de alarmas
- Simulación de escenarios de fallo

---

**Última actualización:** Diciembre 5, 2025  
**Versión:** 1.0  
**Autor:** Sistema SmartBoxing - Arquitectura de Sistemas
