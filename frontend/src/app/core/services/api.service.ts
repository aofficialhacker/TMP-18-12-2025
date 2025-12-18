import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Companies
  getCompanies(includeInactive = false): Observable<any[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<any[]>(`${this.apiUrl}/companies`, { params });
  }

  getCompany(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/companies/${id}`);
  }

  createCompany(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/companies`, data);
  }

  updateCompany(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/companies/${id}`, data);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/companies/${id}`);
  }

  // Categories
  getCategories(includeInactive = false): Observable<any[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<any[]>(`${this.apiUrl}/categories`, { params });
  }

  getCategory(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${id}`);
  }

  updateCategoryWeights(categories: { id: number; weightage: number }[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categories/weights`, { categories });
  }

  validateCategoryWeights(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/categories/validate-weights`);
  }

  // Features
  getFeatures(categoryId?: number, includeInactive = false): Observable<any[]> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}/features`, { params });
  }

  getFeature(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/features/${id}`);
  }

  createFeature(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/features`, data);
  }

  updateFeature(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/features/${id}`, data);
  }

  deleteFeature(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/features/${id}`);
  }

  updateFeatureWeights(categoryId: number, features: { id: number; weightage: number }[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/features/weights/${categoryId}`, { features });
  }

  validateFeatureWeights(categoryId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/features/validate-weights/${categoryId}`);
  }

  // Plans
  getPlans(companyId?: number, includeInactive = false): Observable<any[]> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}/plans`, { params });
  }

  getPlan(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/plans/${id}`);
  }

  createPlan(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/plans`, data);
  }

  updatePlan(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/plans/${id}`, data);
  }

  deletePlan(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/plans/${id}`);
  }

  updatePlanFeatureValues(planId: number, featureValues: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/plans/${planId}/feature-values`, { featureValues });
  }

  // Extraction
  getUploads(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/extraction/uploads`);
  }

  getUpload(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/extraction/${id}`);
  }

  uploadBrochure(file: File, companyId?: number, planId?: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams();
    if (companyId) {
      params = params.set('companyId', companyId.toString());
    }
    if (planId) {
      params = params.set('planId', planId.toString());
    }

    return this.http.post<any>(`${this.apiUrl}/extraction/upload`, formData, { params });
  }

  processExtraction(uploadId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/extraction/${uploadId}/process`, {});
  }

  getExtractionStatus(uploadId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/extraction/${uploadId}/status`);
  }

  getExtractionResults(uploadId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/extraction/${uploadId}/results`);
  }

  verifyExtraction(uploadId: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/extraction/${uploadId}/verify`, data);
  }

  deleteUpload(uploadId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/extraction/${uploadId}`);
  }
}
