/**
 * Retorna um device_id único por dispositivo, armazenado no localStorage.
 * Usado como identificador do usuário sem necessidade de autenticação.
 */
export function getDeviceId(): string {
  let id = localStorage.getItem('natofit_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('natofit_device_id', id);
  }
  return id;
}

/**
 * Retorna a data de hoje no formato ISO (YYYY-MM-DD) no fuso local.
 */
export function getTodayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
