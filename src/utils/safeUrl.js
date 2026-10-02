// Nur http(s)-Links als href zulassen (verhindert javascript:-URLs)
export const isSafeUrl = url => typeof url === 'string' && /^https?:\/\//i.test(url.trim())
