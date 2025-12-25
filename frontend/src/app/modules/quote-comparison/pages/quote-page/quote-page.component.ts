import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareQuoteButtonComponent } from '../../components/share-quote-button/share-quote-button.component';
import { ComparisonResult } from '../../models/comparison.model';

@Component({
  selector: 'app-quote-page',
  standalone: true,
  imports: [
    CommonModule,
    ShareQuoteButtonComponent
  ],
  templateUrl: './quote-page.component.html'
})
export class QuotePageComponent {
  comparisonResult: ComparisonResult | null =
    history.state?.comparisonResult ?? null;
}
