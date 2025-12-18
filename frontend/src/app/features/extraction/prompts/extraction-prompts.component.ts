import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface ValueTypeOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-extraction-prompts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Extraction Prompts Configuration</h2>
        <button class="btn btn-primary" (click)="saveAll()" [disabled]="isSaving">
          {{ isSaving ? 'Saving...' : 'Save All Changes' }}
        </button>
      </div>

      <div class="filter-bar">
        <label>Filter by Category:</label>
        <select [(ngModel)]="selectedCategoryId" (change)="filterFeatures()">
          <option [value]="null">All Categories</option>
          <option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="info-card card">
        <p>
          <strong>Instructions:</strong> Configure extraction prompts for each feature to help AI extract accurate values.
          The prompt should describe what to extract and in what format.
        </p>
        <p class="example">
          <strong>Example:</strong> For "No Claim Bonus" feature, you can write:
          <em>"will be percentage value like 0%, 25%, 50%, etc indicating the discount for no claims"</em>
        </p>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 120px;">Category</th>
                <th style="width: 150px;">Feature Name</th>
                <th style="width: 300px;">Extraction Prompt</th>
                <th style="width: 120px;">Value Type</th>
                <th style="width: 100px;">Standardization</th>
                <th style="width: 80px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let feature of filteredFeatures">
                <td>{{ feature.category?.name }}</td>
                <td><strong>{{ feature.name }}</strong></td>
                <td>
                  <textarea
                    [(ngModel)]="feature.extractionPrompt"
                    rows="3"
                    placeholder="e.g., will be percentage value like 0%, 25%, 50%..."
                    class="prompt-input"
                  ></textarea>
                </td>
                <td>
                  <select [(ngModel)]="feature.valueType" class="value-type-select">
                    <option *ngFor="let type of valueTypes" [value]="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </td>
                <td class="text-center">
                  <button class="btn-icon" (click)="openStandardizationModal(feature)" title="Configure Standardization">
                    ⚙️
                  </button>
                </td>
                <td class="text-center">
                  <button
                    class="btn btn-sm"
                    (click)="saveFeature(feature)"
                    [disabled]="isSaving"
                  >
                    Save
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!filteredFeatures.length" class="no-data">
            No features found. Please create features first.
          </p>
        </div>
      </div>

      <!-- Standardization Modal -->
      <div class="modal-overlay" *ngIf="showStandardizationModal" (click)="closeStandardizationModal()">
        <div class="modal standardization-modal" (click)="$event.stopPropagation()">
          <h3>Configure Standardization: {{ editingFeature?.name }}</h3>

          <div class="form-group">
            <label>Value Type</label>
            <select [(ngModel)]="editingFeature.valueType" (change)="onValueTypeChange()" disabled class="readonly">
              <option *ngFor="let type of valueTypes" [value]="type.value">{{ type.label }}</option>
            </select>
            <small>Change value type in the main table</small>
          </div>

          <div class="form-group">
            <label>Default Value (when not found)</label>
            <input
              type="text"
              [(ngModel)]="standardizationForm.defaultValue"
              placeholder="e.g., 0, NOT_SPECIFIED, etc."
            />
          </div>

          <!-- ENUM specific fields -->
          <div *ngIf="editingFeature?.valueType === 'enum'" class="form-group">
            <label>Allowed Values (comma-separated)</label>
            <input
              type="text"
              [(ngModel)]="allowedValuesInput"
              placeholder="e.g., SINGLE, SHARED, DELUXE"
            />
            <small>Predefined values that AI should map to</small>
          </div>

          <!-- NUMERIC/CURRENCY specific fields -->
          <div *ngIf="editingFeature?.valueType === 'numeric' || editingFeature?.valueType === 'currency'">
            <div class="form-row">
              <div class="form-group">
                <label>Unit</label>
                <input
                  type="text"
                  [(ngModel)]="standardizationForm.normalize.unit"
                  placeholder="e.g., days, lakhs"
                />
              </div>
              <div class="form-group">
                <label>Min Value</label>
                <input
                  type="number"
                  [(ngModel)]="standardizationForm.normalize.minValue"
                />
              </div>
              <div class="form-group">
                <label>Max Value</label>
                <input
                  type="number"
                  [(ngModel)]="standardizationForm.normalize.maxValue"
                />
              </div>
            </div>
          </div>

          <!-- Mappings for all types -->
          <div class="form-group">
            <label>Value Mappings (Optional)</label>
            <small>Map common variations to standardized values</small>
            <div class="mappings-container">
              <div *ngFor="let mapping of mappingsList; let i = index" class="mapping-row">
                <input
                  type="text"
                  [(ngModel)]="mapping.key"
                  placeholder="If extracted..."
                  class="mapping-key"
                />
                <span class="arrow">→</span>
                <input
                  type="text"
                  [(ngModel)]="mapping.value"
                  placeholder="Standardize to"
                  class="mapping-value"
                />
                <button class="btn-remove" (click)="removeMapping(i)">✕</button>
              </div>
              <button class="btn btn-sm" (click)="addMapping()">+ Add Mapping</button>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="closeStandardizationModal()">
              Cancel
            </button>
            <button type="button" class="btn btn-primary" (click)="saveStandardization()">
              Save Standardization
            </button>
          </div>
        </div>
      </div>

      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner">Loading features...</div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 20px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .filter-bar {
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .filter-bar select {
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .info-card {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      margin-bottom: 20px;
    }
    .info-card p { margin: 8px 0; }
    .example {
      margin-top: 12px;
      padding: 8px;
      background: #fff;
      border-radius: 4px;
    }
    .example em { color: #666; }

    .card {
      background: #fff;
      border-radius: 8px;
      padding: 20px;
      overflow: hidden;
    }

    .table-wrapper { overflow-x: auto; }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 900px;
    }
    .data-table th, .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }
    .data-table th {
      background: #f5f5f5;
      font-weight: 600;
      position: sticky;
      top: 0;
    }

    .prompt-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      box-sizing: border-box;
    }
    .prompt-input:focus {
      outline: none;
      border-color: #4a9eff;
    }

    .value-type-select {
      width: 100%;
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .text-center { text-align: center; }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.2s;
    }
    .btn-primary { background: #4a9eff; color: #fff; }
    .btn-primary:hover { background: #3a8eef; }
    .btn-secondary { background: #e0e0e0; color: #333; }
    .btn-secondary:hover { background: #d0d0d0; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.2rem;
      padding: 4px;
    }
    .btn-icon:hover { transform: scale(1.2); }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .form-group { margin-bottom: 16px; }
    .form-group label {
      display: block;
      margin-bottom: 6px;
      font-weight: 500;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      box-sizing: border-box;
    }
    .form-group input.readonly,
    .form-group select.readonly {
      background: #f5f5f5;
      cursor: not-allowed;
    }
    .form-group small {
      color: #666;
      font-size: 0.8rem;
      display: block;
      margin-top: 4px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .mappings-container {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      background: #fafafa;
    }
    .mapping-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .mapping-key, .mapping-value {
      flex: 1;
      padding: 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .arrow { color: #666; font-weight: bold; }
    .btn-remove {
      background: #f44336;
      color: #fff;
      border: none;
      border-radius: 4px;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-remove:hover { background: #d32f2f; }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }

    .no-data {
      color: #666;
      font-style: italic;
      text-align: center;
      padding: 40px 20px;
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(255,255,255,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999;
    }
    .spinner {
      font-size: 1.2rem;
      color: #4a9eff;
    }
  `],
})
export class ExtractionPromptsComponent implements OnInit {
  private apiService = inject(ApiService);

  categories: any[] = [];
  features: any[] = [];
  filteredFeatures: any[] = [];
  selectedCategoryId: number | null = null;

  valueTypes: ValueTypeOption[] = [
    { value: 'text', label: 'Text' },
    { value: 'numeric', label: 'Numeric' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'percentage', label: 'Percentage' },
    { value: 'currency', label: 'Currency' },
    { value: 'enum', label: 'Enum' },
  ];

  showStandardizationModal = false;
  editingFeature: any = null;
  standardizationForm: any = {
    defaultValue: '',
    allowedValues: [],
    mappings: {},
    normalize: {
      unit: '',
      minValue: null,
      maxValue: null,
    },
  };
  allowedValuesInput = '';
  mappingsList: { key: string; value: string }[] = [];

  isLoading = false;
  isSaving = false;

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeatures();
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Failed to load categories:', err),
    });
  }

  loadFeatures(): void {
    this.isLoading = true;
    this.apiService.getFeatures(undefined, true).subscribe({
      next: (features) => {
        this.features = features;
        this.filterFeatures();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load features:', err);
        alert('Failed to load features');
        this.isLoading = false;
      },
    });
  }

  filterFeatures(): void {
    if (this.selectedCategoryId) {
      this.filteredFeatures = this.features.filter(
        (f) => f.categoryId === this.selectedCategoryId && f.isActive
      );
    } else {
      this.filteredFeatures = this.features.filter((f) => f.isActive);
    }
  }

  saveFeature(feature: any): void {
    this.isSaving = true;
    const data = {
      extractionPrompt: feature.extractionPrompt,
      valueType: feature.valueType,
      standardizationRules: feature.standardizationRules,
    };

    this.apiService.updateFeature(feature.id, data).subscribe({
      next: () => {
        this.isSaving = false;
        alert(`Feature "${feature.name}" saved successfully`);
      },
      error: (err) => {
        this.isSaving = false;
        alert(err.error?.message || 'Failed to save feature');
      },
    });
  }

  saveAll(): void {
    this.isSaving = true;
    let savedCount = 0;
    const totalFeatures = this.filteredFeatures.length;

    if (totalFeatures === 0) {
      alert('No features to save');
      this.isSaving = false;
      return;
    }

    this.filteredFeatures.forEach((feature) => {
      const data = {
        extractionPrompt: feature.extractionPrompt,
        valueType: feature.valueType,
        standardizationRules: feature.standardizationRules,
      };

      this.apiService.updateFeature(feature.id, data).subscribe({
        next: () => {
          savedCount++;
          if (savedCount === totalFeatures) {
            this.isSaving = false;
            alert(`All ${totalFeatures} features saved successfully`);
          }
        },
        error: (err) => {
          console.error(`Failed to save ${feature.name}:`, err);
          savedCount++;
          if (savedCount === totalFeatures) {
            this.isSaving = false;
            alert('Some features failed to save. Check console for details.');
          }
        },
      });
    });
  }

  openStandardizationModal(feature: any): void {
    this.editingFeature = { ...feature };

    // Initialize standardization form with existing rules
    const rules = feature.standardizationRules || {};
    this.standardizationForm = {
      defaultValue: rules.defaultValue || '',
      allowedValues: rules.allowedValues || [],
      mappings: rules.mappings || {},
      normalize: {
        unit: rules.normalize?.unit || '',
        minValue: rules.normalize?.minValue || null,
        maxValue: rules.normalize?.maxValue || null,
      },
    };

    // Convert allowedValues array to comma-separated string
    this.allowedValuesInput = (rules.allowedValues || []).join(', ');

    // Convert mappings object to array for easier editing
    this.mappingsList = Object.entries(rules.mappings || {}).map(([key, value]) => ({
      key,
      value: value as string,
    }));

    this.showStandardizationModal = true;
  }

  closeStandardizationModal(): void {
    this.showStandardizationModal = false;
    this.editingFeature = null;
  }

  onValueTypeChange(): void {
    // Reset type-specific fields when value type changes
    if (this.editingFeature.valueType !== 'enum') {
      this.allowedValuesInput = '';
      this.standardizationForm.allowedValues = [];
    }
    if (this.editingFeature.valueType !== 'numeric' && this.editingFeature.valueType !== 'currency') {
      this.standardizationForm.normalize = { unit: '', minValue: null, maxValue: null };
    }
  }

  addMapping(): void {
    this.mappingsList.push({ key: '', value: '' });
  }

  removeMapping(index: number): void {
    this.mappingsList.splice(index, 1);
  }

  saveStandardization(): void {
    // Convert inputs back to standardization rules format
    const rules: any = {
      defaultValue: this.standardizationForm.defaultValue || null,
    };

    // Add allowedValues for ENUM type
    if (this.editingFeature.valueType === 'enum' && this.allowedValuesInput) {
      rules.allowedValues = this.allowedValuesInput
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v);
    }

    // Add normalize settings for NUMERIC/CURRENCY types
    if (this.editingFeature.valueType === 'numeric' || this.editingFeature.valueType === 'currency') {
      const normalize: any = {};
      if (this.standardizationForm.normalize.unit) {
        normalize.unit = this.standardizationForm.normalize.unit;
      }
      if (this.standardizationForm.normalize.minValue !== null) {
        normalize.minValue = this.standardizationForm.normalize.minValue;
      }
      if (this.standardizationForm.normalize.maxValue !== null) {
        normalize.maxValue = this.standardizationForm.normalize.maxValue;
      }
      if (Object.keys(normalize).length > 0) {
        rules.normalize = normalize;
      }
    }

    // Add mappings
    const mappings: any = {};
    this.mappingsList.forEach((m) => {
      if (m.key && m.value) {
        mappings[m.key] = m.value;
      }
    });
    if (Object.keys(mappings).length > 0) {
      rules.mappings = mappings;
    }

    // Update the feature in the local list
    const featureIndex = this.features.findIndex((f) => f.id === this.editingFeature.id);
    if (featureIndex !== -1) {
      this.features[featureIndex].standardizationRules = rules;
      this.features[featureIndex].valueType = this.editingFeature.valueType;
    }

    // Update filtered features
    const filteredIndex = this.filteredFeatures.findIndex((f) => f.id === this.editingFeature.id);
    if (filteredIndex !== -1) {
      this.filteredFeatures[filteredIndex].standardizationRules = rules;
      this.filteredFeatures[filteredIndex].valueType = this.editingFeature.valueType;
    }

    this.closeStandardizationModal();
    alert('Standardization rules updated. Click "Save" to persist changes.');
  }
}
