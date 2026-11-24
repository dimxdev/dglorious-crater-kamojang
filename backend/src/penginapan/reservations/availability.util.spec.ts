import {
  groupRequestedUnits,
  insufficientUnitsMessage,
} from './availability.util';

describe('groupRequestedUnits', () => {
  it('menjumlahkan item bertipe sama dan mengurutkan menurut roomTypeId', () => {
    expect(
      groupRequestedUnits([
        { roomTypeId: 5 },
        { roomTypeId: 2, qty: 2 },
        { roomTypeId: 5 },
        { roomTypeId: 5 },
      ]),
    ).toEqual([
      [2, 2],
      [5, 3],
    ]);
  });

  it('qty bawaan 1', () => {
    expect(groupRequestedUnits([{ roomTypeId: 1 }])).toEqual([[1, 1]]);
  });
});

describe('insufficientUnitsMessage', () => {
  it('memakai nama tipe dan sisa unit', () => {
    expect(insufficientUnitsMessage('Eagle Hill', 1)).toBe(
      'Eagle Hill hanya tersisa 1 unit untuk tanggal yang dipilih',
    );
  });
});
