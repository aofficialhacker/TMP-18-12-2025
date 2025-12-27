import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ComparisonPlan } from '../models/comparison.model';

@Injectable({ providedIn: 'root' })
export class PlanDataService {

  private readonly BASE_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/companies`);
  }

  getPlansByCompany(companyId: number | string): Observable<ComparisonPlan[]> {
    const params = new HttpParams().set('companyId', String(companyId));

    return this.http.get<any[]>(`${this.BASE_URL}/plans`, { params }).pipe(
      map(plans =>
        plans.map(p => ({
          planId: p.id,
          planName: p.name,
          sumInsured: p.sumInsured,
          premium: p.premium,
          companyName: p.company.name,
          companyLogo: p.company.logoUrl?.startsWith('http')
            ? p.company.logoUrl
            : environment.assetUrl + p.company.logoUrl
        }))
      )
    );
  }
}
