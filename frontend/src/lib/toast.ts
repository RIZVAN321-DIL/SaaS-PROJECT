type ToastType = 'success' | 'error' | 'info';

type ToastListener = (toast: {
  message: string;
  type: ToastType;
}) => void;

class ToastEmitter {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);

    return () => {
      this.listeners = this.listeners.filter(
        (l) => l !== listener,
      );
    };
  }

  emit(message: string, type: ToastType = 'info') {
    for (const listener of this.listeners) {
      listener({ message, type });
    }
  }

  success(message: string) {
    this.emit(message, 'success');
  }

  error(message: string) {
    this.emit(message, 'error');
  }

  info(message: string) {
    this.emit(message, 'info');
  }
}

export const toast = new ToastEmitter();
