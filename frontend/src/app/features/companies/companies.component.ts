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
          <td class="logo-cell">
            <img *ngIf="company.logoUrl"
                 [src]="company.logoUrl.startsWith('http') 
                    ? company.logoUrl 
                    : 'http://localhost:3000' + company.logoUrl"
                 class="company-logo hover-logo"/>
          </td>

          <td><strong>{{ company.name }}</strong></td>
          <td>{{ company.activePlansCount || 0 }}</td>

          <td>
            <span class="badge"
              [class.active]="company.isActive"
              [class.inactive]="!company.isActive">
              {{ company.isActive ? 'Active' : 'Inactive' }}
            </span>
          </td>

          <td>{{ company.createdAt | date:'mediumDate' }}</td>

          <td>
            <div class="actions-cell">
              <button class="icon-btn" (click)="editCompany(company)">✏️</button>

              <label class="toggle">
                <input type="checkbox"
                       [checked]="company.isActive"
                       (change)="persistStatus(company)">
                <span class="slider">
                  <span class="toggle-label">{{ company.isActive ? 'ON' : 'OFF' }}</span>
                </span>
              </label>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- MODAL -->
  <div class="modal-overlay" *ngIf="showForm" (click)="closeForm()">
    <div class="modal" (click)="$event.stopPropagation()">
      <h3>{{ editingCompany ? 'Edit Company' : 'Add Company' }}</h3>

      <div class="form-group">
        <label>Name</label>
        <input [(ngModel)]="formData.name">
      </div>

      <div class="form-group">
        <label>Logo URL</label>
        <input [(ngModel)]="formData.logoUrl" [disabled]="!!selectedFile" (input)="onLogoUrlChange()">
      </div>

      <div class="form-group">
        <label>Upload Logo</label>
        <input type="file" accept="image/*" [disabled]="!!formData.logoUrl" (change)="onFileSelect($event)">
      </div>

      <div class="form-group">
        <label>Company URL</label>
        <input [(ngModel)]="formData.companyUrl">
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" (click)="closeForm()">Cancel</button>
        <button class="btn btn-primary" (click)="saveCompany()">
          {{ editingCompany ? 'Update' : 'Create' }}
        </button>
      </div>
    </div>
  </div>
</div>
`,
  styles: [`
.page-container { padding:20px }
.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.card{background:#fff;border-radius:8px;padding:20px}
.data-table{width:100%;border-collapse:collapse;table-layout:fixed}
.data-table th,.data-table td{padding:12px;text-align:center;border-bottom:1px solid #eee;vertical-align:middle}
.logo-cell{width:160px}
.company-logo{width:120px;height:50px;object-fit:contain;background:#f5f5f5;border-radius:6px;display:block;margin:0 auto;}
.hover-logo:hover{transform:scale(1.05);box-shadow:0 4px 10px rgba(0,0,0,.15);transition:.2s}
.badge{padding:4px 10px;border-radius:6px;font-size:12px}
.badge.active{background:#e8f5e9;color:#2e7d32}
.badge.inactive{background:#fdecea;color:#c62828}
.actions-cell{display:flex;justify-content:center;align-items:center;gap:12px}
.icon-btn{border:none;background:#f1f1f1;border-radius:50%;width:36px;height:36px;cursor:pointer}
.icon-btn:hover{background:#dbe9ff}
.toggle{position:relative;width:60px;height:26px}
.toggle input{display:none}
.slider{position:absolute;inset:0;background:#f44336;border-radius:26px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;transition:.3s}
.toggle input:checked + .slider{background:#4caf50}
.btn{padding:10px 20px;border-radius:6px;border:none;cursor:pointer}
.btn-primary{background:#4a9eff;color:#fff}
.btn-secondary{background:#e0e0e0}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
.modal{background:#fff;padding:24px;border-radius:12px;width:420px}
.form-group{margin-bottom:14px}
.form-group input{width:100%;padding:8px;border:1px solid #ddd;border-radius:6px}
.form-actions{display:flex;justify-content:flex-end;gap:10px}
`]
})
export class CompaniesComponent implements OnInit {

  private apiService = inject(ApiService);

  companies:any[]=[];
  showForm=false;
  editingCompany:any=null;
  selectedFile:File|null=null;

  formData={ name:'', logoUrl:'', companyUrl:'' };

  ngOnInit(){ this.loadCompanies(); }
  loadCompanies(){ this.apiService.getCompanies(true).subscribe(c=>this.companies=c); }

  openForm(){ this.showForm=true; this.editingCompany=null; }
  closeForm(){ this.showForm=false; }

  editCompany(c:any){
    this.editingCompany=c;
    this.formData={ name:c.name, logoUrl:c.logoUrl||'', companyUrl:c.companyUrl||'' };
    this.showForm=true;
  }

  persistStatus(c:any){
    const newValue = !c.isActive;
    this.apiService.updateCompany(c.id,{ isActive:newValue }).subscribe(()=>{
      c.isActive = newValue;
    });
  }

  onLogoUrlChange(){ this.selectedFile=null; }
  onFileSelect(e:any){ this.selectedFile=e.target.files[0]; this.formData.logoUrl=''; }

  saveCompany(){
    const f=new FormData();
    f.append('name',this.formData.name);
    f.append('companyUrl',this.formData.companyUrl||'');
    if(this.formData.logoUrl) f.append('logo_url', this.formData.logoUrl);
    if(this.selectedFile) f.append('logo',this.selectedFile);

    const req=this.editingCompany
      ?this.apiService.updateCompany(this.editingCompany.id,f)
      :this.apiService.createCompany(f);

    req.subscribe(()=>{ this.closeForm(); this.loadCompanies(); });
  }
}
