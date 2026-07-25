import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportRowError } from '../../../core/models';

type ImportFileType = 'csv' | 'excel';

export interface ImportResultLike {
  imported: number;
}

export interface ImportDialogData<TResult extends ImportResultLike> {
  title: string;
  hint: string;
  importCsv: (file: File) => Observable<TResult>;
  importExcel: (file: File) => Observable<TResult>;
}

@Component({
  selector: 'app-import-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './import-dialog.html',
  styleUrl: './import-dialog.scss',
})
export class ImportDialog<TResult extends ImportResultLike = ImportResultLike> {
  private readonly dialogRef = inject(MatDialogRef<ImportDialog<TResult>, TResult | undefined>);
  readonly data = inject<ImportDialogData<TResult>>(MAT_DIALOG_DATA);

  readonly selectedFile = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly rowErrors = signal<ImportRowError[]>([]);
  readonly generalError = signal<string | null>(null);
  readonly result = signal<TResult | null>(null);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFile.set(file);
    this.rowErrors.set([]);
    this.generalError.set(null);
    this.result.set(null);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) return;

    const type = this.detectFileType(file);
    if (!type) {
      this.generalError.set('Unsupported file type. Please upload a .csv, .xls, or .xlsx file.');
      return;
    }

    this.isUploading.set(true);
    this.rowErrors.set([]);
    this.generalError.set(null);

    const request$ = type === 'csv' ? this.data.importCsv(file) : this.data.importExcel(file);

    request$.subscribe({
      next: (result) => {
        this.isUploading.set(false);
        this.result.set(result);
      },
      error: (err: HttpErrorResponse) => {
        this.isUploading.set(false);
        const details = err.error?.details as ImportRowError[] | undefined;
        if (Array.isArray(details) && details.length > 0) {
          this.rowErrors.set(details);
        } else {
          this.generalError.set(err.error?.message ?? 'Import failed. Please try again.');
        }
      },
    });
  }

  done(): void {
    this.dialogRef.close(this.result() ?? undefined);
  }

  cancel(): void {
    this.dialogRef.close(undefined);
  }

  private detectFileType(file: File): ImportFileType | null {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) return 'csv';
    if (name.endsWith('.xls') || name.endsWith('.xlsx')) return 'excel';
    return null;
  }
}
