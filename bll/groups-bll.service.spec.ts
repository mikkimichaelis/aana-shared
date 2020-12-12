import { TestBed } from '@angular/core/testing';

import { GroupsBLLService } from './groups-bll.service';

describe('GroupsBLLService', () => {
  let service: GroupsBLLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupsBLLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
