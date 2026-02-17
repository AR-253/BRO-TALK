export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    if (path.startsWith('/uploads')) return `${baseUrl}${path}`;
    if (path.startsWith('uploads')) return `${baseUrl}/${path}`;
    return path;
};
