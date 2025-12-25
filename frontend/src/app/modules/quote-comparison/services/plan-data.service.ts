import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
  id: number | string;
  name: string;
  // include other fields your backend returns (logoUrl, isActive, etc.) if needed
  [key: string]: any;
}

export interface Plan {
  id: number | string;
  companyId: number | string;
  name: string;
  // include other fields returned by backend (sumInsured defaults, features, etc.)
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class PlanDataService {

  // NOTE: backend has a global prefix 'api' (see your backend's main.ts).
  // If your backend runs on a different host/port, update BASE_URL accordingly.
  private readonly BASE_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Fetch companies from backend
   * GET /api/companies
   */
  getCompanies(): Observable<Company[]> {
    const url = `${this.BASE_URL}/companies`;
    return this.http.get<Company[]>(url);
  }

  /**
   * Fetch plans for a given company
   * Backend exposes plans at GET /api/plans?companyId=xxx
   */
  getPlansByCompany(companyId: string | number): Observable<Plan[]> {
    const url = `${this.BASE_URL}/plans`;
    const params = new HttpParams().set('companyId', String(companyId));
    return this.http.get<Plan[]>(url, { params });
  }
}
