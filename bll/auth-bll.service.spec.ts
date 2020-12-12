import { TestBed } from '@angular/core/testing';

import { AuthBLLService } from './auth-bll.service';

describe('AuthBLLService', () => {
  let service: AuthBLLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthBLLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
