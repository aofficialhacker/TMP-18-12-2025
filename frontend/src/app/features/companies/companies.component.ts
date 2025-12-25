import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Companies Management</h2>
        <button class="btn btn-primary" (click)="openForm()">+ Add Company</button>
      </div>

      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Company Logo</th>
              <th>Company Name</th>
              <th>Plans</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let company of companies">
              <td>
                <img
                  *ngIf="company.logoUrl"
                  [src]="company.logoUrl"
                  alt="Company Logo"
                  class="company-logo"
                />
              </td>

              <td><strong>{{ company.name }}</strong></td>
              <td>{{ company.activePlansCount || 0 }}</td>

              <td>
                <span
                  class="badge"
                  [class.active]="company.isActive"
                  [class.inactive]="!company.isActive"
                >
                  {{ company.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>

              <td>{{ company.createdAt | date:'mediumDate' }}</td>

              <td>
                <div class="actions-cell">
                  <button class="btn-icon" (click)="editCompany(company)">✏️</button>

                  <label class="status-toggle">
                    <input
                      type="checkbox"
                      [checked]="company.isActive"
                      (change)="toggleStatus(company)"
                    />
                    <span class="status-slider"></span>
                  </label>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add / Edit Company Modal -->
      <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingCompany ? 'Edit Company' : 'Add Company' }}</h3>

          <form (ngSubmit)="saveCompany()">
            <div class="form-group">
              <label>Company Name *</label>
              <input type="text" [(ngModel)]="formData.name" name="name" required />
            </div>

            <div class="form-group">
              <label>Logo URL</label>
              <input
                type="text"
                name="logoUrl"
                [(ngModel)]="formData.logoUrl"
                [disabled]="!!selectedFile"
                (input)="onLogoUrlChange()"
              />
            </div>

            <div class="form-group">
              <label>Upload Logo</label>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                [disabled]="!!formData.logoUrl"
                (change)="onFileSelect($event)"
              />
            </div>

            <div class="form-group">
              <label>Company URL</label>
              <input type="text" [(ngModel)]="formData.companyUrl" name="companyUrl" />
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeForm()">Cancel</button>
              <button type="submit" class="btn btn-primary">
                {{ editingCompany ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 🌈 Attractive Validation Modal -->
      <div class="modal-overlay" *ngIf="showValidationModal" (click)="closeValidationModal()">
        <div class="modal" (click)="$event.stopPropagation()" style="padding:0; overflow:hidden;">
          
          <div style="
            background: linear-gradient(135deg, #4a9eff, #6f7cff);
            color: white;
            padding: 20px;
            text-align: center;
          ">
            <div style="font-size: 36px;">⚠️</div>
            <h3 style="margin: 8px 0 0;">Validation Required</h3>
          </div>

          <div style="padding: 24px; text-align: center;">
            <p style="font-size: 16px; color: #444; margin-bottom: 24px;">
              Upload Logo URL or Image
            </p>

            <button
              class="btn btn-primary"
              style="min-width: 120px;"
              (click)="closeValidationModal()"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: center; border-bottom: 1px solid #eee; vertical-align: middle; }
    .company-logo { width: 100px; height: 40px; object-fit: contain; border-radius: 4px; background: #f5f5f5; display: block; margin: 0 auto; }
    .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500; }
    .badge.active { background: #e8f5e9; color: #2e7d32; }
    .badge.inactive { background: #fdecea; color: #c62828; }
    .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 1rem; }
    .actions-cell { display: flex; align-items: center; justify-content: center; gap: 10px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: #fff; border-radius: 12px; padding: 24px; width: 100%; max-width: 500px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
    .status-toggle { position: relative; display: inline-block; width: 46px; height: 24px; }
    .status-toggle input { opacity: 0; width: 0; height: 0; }
    .status-slider { position: absolute; inset: 0; cursor: pointer; background-color: #f44336; transition: 0.3s; border-radius: 24px; }
    .status-slider::before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s; border-radius: 50%; }
    .status-toggle input:checked + .status-slider { background-color: #4caf50; }
    .status-toggle input:checked + .status-slider::before { transform: translateX(22px); }
  `],
})
export class CompaniesComponent implements OnInit {
  private apiService = inject(ApiService);

  companies: any[] = [];
  showForm = false;
  editingCompany: any = null;
  selectedFile: File | null = null;
  showValidationModal = false;

  formData = {
    name: '',
    logoUrl: '',
    companyUrl: '',
  };

  ngOnInit(): void {
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.apiService.getCompanies(true).subscribe({
      next: (companies) => (this.companies = companies),
    });
  }

  onLogoUrlChange(): void {
    if (this.formData.logoUrl) this.selectedFile = null;
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
    if (this.selectedFile) this.formData.logoUrl = '';
  }

  toggleStatus(company: any): void {
    const newStatus = !company.isActive;
    this.apiService.updateCompany(company.id, { isActive: newStatus }).subscribe({
      next: () => (company.isActive = newStatus),
    });
  }

  openForm(): void {
    this.editingCompany = null;
    this.formData = { name: '', logoUrl: '', companyUrl: '' };
    this.selectedFile = null;
    this.showForm = true;
  }

  editCompany(company: any): void {
    this.editingCompany = company;
    this.formData = {
      name: company.name,
      logoUrl: company.logoUrl || '',
      companyUrl: company.companyUrl || '',
    };
    this.selectedFile = null;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingCompany = null;
  }

  closeValidationModal(): void {
    this.showValidationModal = false;
  }

  saveCompany(): void {
    if (!this.formData.name || !this.formData.name.trim()) {
      this.showValidationModal = true;
      return;
    }

    if (!this.formData.logoUrl && !this.selectedFile) {
      this.showValidationModal = true;
      return;
    }

    const form = new FormData();
    form.append('name', this.formData.name);
    form.append('companyUrl', this.formData.companyUrl || '');

    if (this.formData.logoUrl) form.append('logoUrl', this.formData.logoUrl);
    if (this.selectedFile) form.append('logo', this.selectedFile);

    const request = this.editingCompany
      ? this.apiService.updateCompany(this.editingCompany.id, form)
      : this.apiService.createCompany(form);

    request.subscribe(() => {
      this.closeForm();
      this.loadCompanies();
    });
  }
}
