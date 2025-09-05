/**
 * Analytics related DTOs
 */

export interface TrackVisitorRequest {
  landingPage: string;
  userAgent?: string;
}

export interface TrackVisitorResponse {
  success: boolean;
  message?: string;
}
