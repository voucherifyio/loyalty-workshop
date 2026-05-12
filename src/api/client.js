import { apiLog } from '../stores/api-log.svelte.js';
import { connection } from '../stores/connection.svelte.js';

class ApiClient {
  async request(method, path, body = null) {
    const startTime = performance.now();
    const url = `${connection.baseUrl}${path}`;

    const headers = {
      'Content-Type': 'application/json',
      'X-Voucherify-API-Version': 'v2018-08-01'
    };

    if (connection.appId) {
      headers['X-App-Id'] = connection.appId;
    }
    if (connection.appToken) {
      headers['X-App-Token'] = connection.appToken;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    let response;
    let responseData;
    let error = null;

    try {
      response = await fetch(url, options);
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        error = responseData;
      }
    } catch (err) {
      error = err.message;
      responseData = { error: err.message };
    }

    const duration = Math.round(performance.now() - startTime);

    // Log the request/response with unique ID
    apiLog.add({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      method,
      url,
      path,
      status: response?.status,
      duration,
      request: {
        headers,
        body
      },
      response: {
        headers: response ? Object.fromEntries(response.headers.entries()) : {},
        body: responseData
      },
      error
    });

    if (error) {
      throw new Error(typeof error === 'string' ? error : JSON.stringify(error));
    }

    return responseData;
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body) {
    return this.request('POST', path, body);
  }

  put(path, body) {
    return this.request('PUT', path, body);
  }

  delete(path) {
    return this.request('DELETE', path);
  }
}

export const api = new ApiClient();
