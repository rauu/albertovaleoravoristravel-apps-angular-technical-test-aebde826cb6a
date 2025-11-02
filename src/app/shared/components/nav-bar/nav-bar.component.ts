import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Language } from '../../models/language.model';
import { environment } from '../../../../environments/environment';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [SelectModule, TranslateModule, FormsModule, RouterLink],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavBarComponent implements OnInit {
  languages: Language[] = [
    { code: 'es', name: 'Español', flag: 'ES' },
    { code: 'en', name: 'English', flag: 'US' }
  ];

  selectedLanguage: Language;

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('language') || environment.defaultLanguage;
    this.selectedLanguage = this.languages.find(lang => lang.code === savedLang) ||
                           this.languages.find(lang => lang.code === environment.defaultLanguage) ||
                           this.languages[0];
  }

  ngOnInit() {
    this.translate.use(this.selectedLanguage.code);
    localStorage.setItem('language', this.selectedLanguage.code);
  }

  onLanguageChange(event: any) {
    const lang = event.value;
    this.translate.use(lang.code);
    localStorage.setItem('language', lang.code);
  }

  trackByLanguageCode(index: number, language: Language): string {
    return language.code;
  }
}
