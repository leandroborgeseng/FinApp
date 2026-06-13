let nextId = 0;
const listeners = new Set();
let queue = [];

function emit() {
  const snapshot = [...queue];
  listeners.forEach((fn) => fn(snapshot));
}

function dismiss(id) {
  queue = queue.filter((t) => t.id !== id);
  emit();
}

function push(message, type = 'success', duration = 2800) {
  const id = ++nextId;
  queue = [...queue.slice(-2), { id, message, type }];
  emit();
  setTimeout(() => dismiss(id), duration);
}

export const toast = {
  success: (message) => push(message, 'success'),
  error: (message) => push(message || 'Algo deu errado', 'error', 4200),
};

export function subscribeToast(fn) {
  listeners.add(fn);
  fn([...queue]);
  return () => listeners.delete(fn);
}

export function mutationToast(successMessage) {
  return {
    onSuccess: () => toast.success(successMessage),
    onError: (err) => toast.error(err?.message || 'Falha ao salvar'),
  };
}
