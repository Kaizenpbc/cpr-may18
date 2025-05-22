const isDevelopment = import.meta.env.DEV;

const logger = {
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    console.warn(...args);
  },

  error: (...args) => {
    console.error(...args);
  },

  // Format error objects for better logging
  formatError: (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        request: error.request,
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      return {
        message: error.message,
      };
    }
  },
};

export default logger; 