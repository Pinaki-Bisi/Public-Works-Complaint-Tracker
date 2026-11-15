import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComplaintService } from './complaint.service';

describe('ComplaintService', () => {
  let service: ComplaintService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ComplaintService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests complaints using server-side filters and pagination', () => {
    service.list({ q: 'pothole', status: 'SUBMITTED', page: 1, size: 10 }).subscribe((result) => {
      expect(result.totalElements).toBe(1);
      expect(result.content[0].ticketNo).toBe('PW-2026-00001');
    });
    const request = http.expectOne((req) => req.url === '/api/complaints');
    expect(request.request.params.get('q')).toBe('pothole');
    expect(request.request.params.get('status')).toBe('SUBMITTED');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('size')).toBe('10');
    request.flush({ content: [{ ticketNo: 'PW-2026-00001' }], totalElements: 1, totalPages: 1, number: 0, size: 10 });
  });
});
