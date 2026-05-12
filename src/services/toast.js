import { Notyf } from 'notyf';

// Create a singleton Notyf instance
const notyf = new Notyf({
  duration: 4000,
  position: {
    x: 'right',
    y: 'top',
  },
  types: [
    {
      type: 'success',
      background: '#22c55e',
      icon: {
        className: 'notyf__icon--success',
        tagName: 'i',
      },
      dismissible: true
    },
    {
      type: 'error',
      background: '#ef4444',
      duration: 6000,
      icon: {
        className: 'notyf__icon--error',
        tagName: 'i',
      },
      dismissible: true
    }
  ]
});

// Export helper methods for easy use
export const toast = {
  success: (message) => {
    notyf.success(message);
  },
  
  error: (message) => {
    notyf.error(message);
  }
};
