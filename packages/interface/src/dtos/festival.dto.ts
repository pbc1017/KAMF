/**
 * Festival related DTOs (Data Transfer Objects)
 */

import { Booth, Stage, Zone } from '../types/festival.type';

export interface GetBoothsResponse {
  data: Booth[];
}

export interface GetBoothsByZoneRequest {
  zone: Zone;
}

export interface GetBoothsByZoneResponse {
  data: Booth[];
}

export interface GetStagesResponse {
  data: {
    fri: Stage[];
    sat: Stage[];
  };
}
