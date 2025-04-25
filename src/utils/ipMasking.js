/**
 * Masks an IP address by replacing parts with asterisks
 * Supports both IPv4 and IPv6 addresses
 */
export function maskIP(ip) {
  if (!ip) return '';

  // Check if IPv6
  if (ip.includes(':')) {
    // Split IPv6 address into segments
    const segments = ip.split(':');
    // Mask middle segments
    const maskedSegments = segments.map((segment, index) => {
      if (index > 1 && index < segments.length - 2) {
        return '****';
      }
      return segment;
    });
    return maskedSegments.join(':');
  }

  // Handle IPv4
  const segments = ip.split('.');
  // Mask last two segments
  const maskedSegments = segments.map((segment, index) => {
    if (index >= segments.length - 2) {
      return '***';
    }
    return segment;
  });
  return maskedSegments.join('.');
}