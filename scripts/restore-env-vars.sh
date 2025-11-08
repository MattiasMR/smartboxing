#!/bin/bash
# Script para restaurar variables de entorno en todas las Lambdas

FUNCTIONS=(
  "getBox"
  "createBox"
  "updateBox"
  "deleteBox"
  "listDoctors"
  "getDoctor"
  "createDoctor"
  "updateDoctor"
  "deleteDoctor"
  "listAppointments"
  "getAppointment"
  "createAppointment"
  "updateAppointment"
  "deleteAppointment"
  "getClientSettings"
  "updateClientSettings"
  "getUserSettings"
  "updateUserSettings"
  "getDashboard"
)

ENV_VARS="Variables={CHAOS_ENABLED=false,T_BOXES=smartboxing-Boxes-dev,T_DOCTORS=smartboxing-Doctors-dev,T_APPOINTMENTS=smartboxing-Appointments-dev,T_PATIENTS=smartboxing-Patients-dev,T_CLIENT_SETTINGS=smartboxing-ClientSettings-dev,T_USER_SETTINGS=smartboxing-UserSettings-dev,USER_POOL_ID=us-east-1_flcHOKjMy,USER_POOL_CLIENT_ID=7o3mbd6s94sp7jtb0p300pc4un}"

echo "🔧 Restaurando variables de entorno en todas las Lambdas..."

for func in "${FUNCTIONS[@]}"; do
  echo "  Actualizando smartboxing-dev-$func..."
  aws lambda update-function-configuration \
    --function-name "smartboxing-dev-$func" \
    --environment "$ENV_VARS" \
    --output text --query 'FunctionName' 2>&1 > /dev/null
  
  if [ $? -eq 0 ]; then
    echo "  ✅ smartboxing-dev-$func"
  else
    echo "  ❌ smartboxing-dev-$func"
  fi
done

echo ""
echo "✨ Variables restauradas en ${#FUNCTIONS[@]} funciones"
