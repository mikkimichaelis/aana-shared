import { TestBed } from '@angular/core/testing';

import { UserBLLService } from './user-bll.service';

describe('UserBLLService', () => {
  let service: UserBLLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserBLLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
