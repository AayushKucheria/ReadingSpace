const API_BASE_URL = 'http://localhost:5000/api';

// Generic API request handler
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const options = {
    method,
    headers: {}
  };
  
  if (data && !(data instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(data);
  } else if (data) {
    options.body = data;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(responseData.error || 'API request failed');
    }
    
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Upload Goodreads library CSV
export const apiUploadLibrary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequest('/upload', 'POST', formData);
};

// Get all books
export const apiGetBooks = async () => {
  return apiRequest('/books');
};

// Find similar books
export const apiSearchSimilar = async (bookId, limit = 10) => {
  return apiRequest('/search/similar', 'POST', { bookId, limit });
};

// Search by concept
export const apiSearchByConcept = async (query, limit = 10) => {
  return apiRequest('/search/concept', 'POST', { query, limit });
}; 