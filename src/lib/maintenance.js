import {
  VECTOR_DB_MAINTENANCE_ENABLED,
  VECTOR_DB_MAINTENANCE_MESSAGE,
  VECTOR_DB_MAINTENANCE_STATUS_PAGE,
} from '@/constants/maintenance.constants'

export const isVectorDbMaintenanceEnabled = () => VECTOR_DB_MAINTENANCE_ENABLED

export const vectorDbMaintenanceResponse = () => ({
  message: VECTOR_DB_MAINTENANCE_MESSAGE,
  statusPage: VECTOR_DB_MAINTENANCE_STATUS_PAGE,
})
