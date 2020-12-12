import { TestBed } from '@angular/core/testing';

import { GroupBLLService } from './group-bll.service';

describe('GroupBLLService', () => {
  let service: GroupBLLService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupBLLService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
