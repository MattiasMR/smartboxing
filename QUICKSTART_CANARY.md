# 🚀 Quick Start - Canary Deployment

Guía rápida para usar el sistema de canary deployment en SmartBoxing.

---

## ⚡ Deployment a Development (Automático)

```bash
# 1. Hacer cambios en tu código
git add .
git commit -m "feat: nueva funcionalidad"

# 2. Push a main (dispara deploy automático a dev)
git push origin milan:main

# 3. Monitorear en GitHub Actions
# https://github.com/MattiasMR/smartboxing/actions
```

**Resultado:** Deploy directo sin canary (~6-8 minutos)

---

## 🐤 Deployment a Production (Canary Manual)

```bash
# 1. Ir a GitHub Actions
# https://github.com/MattiasMR/smartboxing/actions

# 2. Seleccionar workflow "🚀 Deploy SmartBoxing"

# 3. Click "Run workflow"
#    - Branch: milan
#    - Stage: prod

# 4. Aprobar deployment cuando se solicite

# 5. Monitorear el canary en tiempo real
node scripts/canary-monitor.mjs --stage=prod --timeout=25
```

**Resultado:** Deploy canary progresivo 10%→50%→100% (~20-25 minutos)

---

## 🧪 Testing de Rollback

```bash
# Test con simulación de errores (disparar CanaryErrorAlarm)
node scripts/test-canary-rollback.mjs \
  --scenario=errors \
  --function=listBoxes \
  --stage=prod \
  --iterations=10

# Test con simulación de latencia alta (disparar CanaryLatencyAlarm)
node scripts/test-canary-rollback.mjs \
  --scenario=latency \
  --function=getBox \
  --stage=prod \
  --iterations=15

# Test con simulación de throttles (disparar CanaryThrottleAlarm)
node scripts/test-canary-rollback.mjs \
  --scenario=throttle \
  --function=createBox \
  --stage=prod \
  --iterations=20
```

**Resultado:** Alarma disparada → Rollback automático (~3 minutos)

---

## 📊 Monitoreo

### Monitorear Deployment Activo

```bash
# Monitor con timeout default (20 minutos)
node scripts/canary-monitor.mjs --stage=prod

# Monitor con timeout custom (30 minutos)
node scripts/canary-monitor.mjs --stage=prod --timeout=30

# Monitor para dev (si se configura canary)
node scripts/canary-monitor.mjs --stage=dev
```

### Ver Logs de CloudWatch

```bash
# Logs de funciones específicas
aws logs tail /aws/lambda/smartboxing-prod-listBoxes --follow

# Logs de hooks de deployment
aws logs tail /aws/lambda/smartboxing-prod-preTrafficHook --follow
aws logs tail /aws/lambda/smartboxing-prod-postTrafficHook --follow
```

### Verificar Estado de Alarmas

```bash
# Ver estado actual de todas las alarmas
aws cloudwatch describe-alarms \
  --alarm-names smartboxing-prod-CanaryErrorAlarm \
                smartboxing-prod-CanaryLatencyAlarm \
                smartboxing-prod-CanaryThrottleAlarm \
  --query 'MetricAlarms[*].{Name:AlarmName,State:StateValue}' \
  --output table
```

---

## 🔍 Troubleshooting Rápido

### Deployment no progresa

```bash
# Ver deployment activo en CodeDeploy
aws deploy list-deployments \
  --application-name smartboxing-prod \
  --max-items 1

# Ver detalles del deployment
aws deploy get-deployment --deployment-id <deployment-id>
```

### Rollback no funciona

```bash
# Verificar que alarmas están configuradas
aws deploy get-deployment-group \
  --application-name smartboxing-prod \
  --deployment-group-name smartboxing-prod-deployment-group \
  --query 'deploymentGroupInfo.alarmConfiguration'
```

### Chaos mode quedó activo

```bash
# Desactivar manualmente
aws lambda update-function-configuration \
  --function-name smartboxing-prod-listBoxes \
  --environment "Variables={}"
```

---

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| `docs/CANARY_DEPLOYMENT_PLAN.md` | Plan completo de implementación (11 fases) |
| `docs/TESTING_GUIDE.md` | Guía detallada de testing paso a paso |
| `docs/EVIDENCIA_CANARY.md` | Evidencia académica con análisis de resultados |
| `docs/estadoCanario.md` | Estado actual de implementación |
| `README.md` | Documentación general del proyecto |

---

## ⚙️ Configuración

### Funciones con Canary Deployment

| Categoría | Funciones |
|-----------|-----------|
| Boxes | listBoxes, getBox, createBox |
| Staff | listStaff, createStaffMember |
| Appointments | listAppointments, getAppointment, createAppointment |
| Patients | listPatients |
| Settings | getClientSettings |
| Analytics | getDashboard |

**Total:** 11 funciones críticas de 29 totales (38%)

### CloudWatch Alarms

| Alarma | Threshold | Acción |
|--------|-----------|--------|
| CanaryErrorAlarm | >5 errores / 2min | Stop deployment + SNS |
| CanaryLatencyAlarm | p99 > 2000ms / 2min | Stop deployment + SNS |
| CanaryThrottleAlarm | >5 throttles / 2min | Stop deployment + SNS |

### Timeline de Canary

```
0min ──► 5min ──► 15min ──► 20min
 0%      10%      50%      100%
  │       │        │         │
  └─ Deploy ─► Validate ─► Complete
```

- **Fase 10%:** 5 minutos de validación
- **Fase 50%:** 10 minutos de validación
- **Fase 100%:** 5 minutos finales
- **Total:** ~20-25 minutos

---

## 📧 Notificaciones

**Email:** milan.munoz@udd.cl  
**Topic SNS:** smartboxing-prod-canary-alerts  
**Eventos:**
- ✅ Deployment exitoso
- ❌ Deployment fallido
- 🔄 Rollback ejecutado
- ⚠️ Alarma disparada

---

## 🎯 Comandos Más Usados

```bash
# Deploy a dev (automático con push)
git push origin milan:main

# Monitorear canary de prod
node scripts/canary-monitor.mjs --stage=prod

# Test de rollback
node scripts/test-canary-rollback.mjs --scenario=errors --function=listBoxes --stage=prod

# Ver estado de alarmas
aws cloudwatch describe-alarms --alarm-names smartboxing-prod-CanaryErrorAlarm

# Ver logs en tiempo real
aws logs tail /aws/lambda/smartboxing-prod-listBoxes --follow

# Verificar alias Lambda
aws lambda get-alias --function-name smartboxing-prod-listBoxes --name live
```

---

**Última actualización:** Diciembre 5, 2025  
**Versión:** 1.0  
**Autor:** SmartBoxing Team
