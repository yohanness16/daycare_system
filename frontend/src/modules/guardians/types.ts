import type { UUID } from '../../core/types/common';

export interface Guardian {
  id: UUID;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string | null;
}

export interface CreateGuardianDto {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string | null;
}

export interface UpdateGuardianDto {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  photoUrl?: string | null;
}
