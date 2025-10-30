import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavBarComponent } from './nav-bar.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../../environments/environment';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavBarComponent', () => {
  let component: NavBarComponent;
  let fixture: ComponentFixture<NavBarComponent>;
  let translateService: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NavBarComponent,
        RouterTestingModule,
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })
      ]
    }).compileComponents();

    translateService = TestBed.inject(TranslateService);
    translateService.setTranslation('es', { navbar: { title: 'Avoristech Travel', language: 'Idioma' } }, true);
    translateService.setTranslation('en', { navbar: { title: 'Avoristech Travel', language: 'Language' } }, true);
    translateService.setDefaultLang(environment.defaultLanguage);
    spyOn(translateService, 'use').and.callThrough();

    fixture = TestBed.createComponent(NavBarComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Language Initialization', () => {
    it('should have Spanish and English languages', () => {
      expect(component.languages.length).toBe(2);
      expect(component.languages[0].code).toBe('es');
      expect(component.languages[1].code).toBe('en');
    });

    it('should initialize with saved language from localStorage', () => {
      localStorage.setItem('language', 'en');
      fixture.detectChanges();

      expect(component.selectedLanguage.code).toBe('en');
    });

    it('should use default language if none is saved', () => {
      localStorage.removeItem('language');
      fixture.detectChanges();

      expect(component.selectedLanguage.code).toBe(environment.defaultLanguage);
    });
  });

  describe('ngOnInit', () => {
    it('should set up the initial translation service', () => {
      fixture.detectChanges();

      expect(translateService.use).toHaveBeenCalledWith(component.selectedLanguage.code);
    });

    it('should save language to localStorage on init', () => {
      fixture.detectChanges();

      expect(localStorage.getItem('language')).toBe(component.selectedLanguage.code);
    });
  });

  describe('Language Change', () => {
    it('should change language and update localStorage', () => {
      const englishLang = { code: 'en', name: 'English', flag: 'US' };
      const event = { value: englishLang };

      component.onLanguageChange(event);

      expect(translateService.use).toHaveBeenCalledWith('en');
      expect(localStorage.getItem('language')).toBe('en');
    });

    it('should support switching from Spanish to English', () => {
      const englishLang = component.languages[1];
      component.onLanguageChange({ value: englishLang });

      expect(localStorage.getItem('language')).toBe('en');
    });

    it('should support switching from English to Spanish', () => {
      const spanishLang = component.languages[0];
      component.onLanguageChange({ value: spanishLang });

      expect(localStorage.getItem('language')).toBe('es');
    });
  });

  describe('TrackBy Function', () => {
    it('should track language by code', () => {
      const spanish = { code: 'es', name: 'Español', flag: 'ES' };
      const english = { code: 'en', name: 'English', flag: 'US' };

      expect(component.trackByLanguageCode(0, spanish)).toBe('es');
      expect(component.trackByLanguageCode(1, english)).toBe('en');
    });

    it('should return unique identifiers for different languages', () => {
      const lang1 = component.languages[0];
      const lang2 = component.languages[1];

      const id1 = component.trackByLanguageCode(0, lang1);
      const id2 = component.trackByLanguageCode(1, lang2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('Language Properties', () => {
    it('should have language names and flags', () => {
      component.languages.forEach(lang => {
        expect(lang.code).toBeDefined();
        expect(lang.name).toBeDefined();
        expect(lang.flag).toBeDefined();
      });
    });

    it('Spanish should have correct properties', () => {
      const spanish = component.languages.find(l => l.code === 'es');
      expect(spanish).toEqual({ code: 'es', name: 'Español', flag: 'ES' });
    });

    it('English should have correct properties', () => {
      const english = component.languages.find(l => l.code === 'en');
      expect(english).toEqual({ code: 'en', name: 'English', flag: 'US' });
    });
  });
});
