import {
  isRealDate,
  validateAdultCapacity,
  validateChildrenCapacity,
  validateDiscount,
  validateDownPayment,
  validateStayDates,
} from './stay-validation.util';

describe('isRealDate', () => {
  it('menerima tanggal nyata, juga dengan bagian waktu', () => {
    expect(isRealDate('2027-03-10')).toBe(true);
    expect(isRealDate('2028-02-29')).toBe(true);
    expect(isRealDate('2027-03-10T12:00:00.000Z')).toBe(true);
  });
  it('menolak tanggal mustahil & format salah', () => {
    expect(isRealDate('2027-02-30')).toBe(false);
    expect(isRealDate('2027-02-29')).toBe(false);
    expect(isRealDate('2027-13-01')).toBe(false);
    expect(isRealDate('10-03-2027')).toBe(false);
    expect(isRealDate(20270310)).toBe(false);
  });
});

describe('validateStayDates', () => {
  it('valid', () => {
    expect(validateStayDates('2027-03-10', '2027-03-11')).toBeNull();
    expect(validateStayDates('2027-03-01', '2027-03-31')).toBeNull();
  });
  it('check-out sama/sebelum check-in', () => {
    const msg = 'Tanggal check-out harus setelah tanggal check-in.';
    expect(validateStayDates('2027-03-10', '2027-03-10')).toBe(msg);
    expect(validateStayDates('2027-03-10', '2027-03-09')).toBe(msg);
  });
  it('lebih dari 30 malam', () => {
    expect(validateStayDates('2027-03-01', '2027-04-01')).toBe(
      'Lama menginap maksimal 30 malam.',
    );
  });
  it('tanggal mustahil', () => {
    expect(validateStayDates('2027-02-30', '2027-03-02')).toBe(
      'Tanggal tidak valid.',
    );
  });
});

describe('validateAdultCapacity', () => {
  it('extra bed menambah kapasitas dewasa', () => {
    expect(validateAdultCapacity(4, 2, 2, 'Eagle Hill')).toBeNull();
    expect(validateAdultCapacity(5, 2, 2, 'Eagle Hill')).toBe(
      'Jumlah tamu dewasa melebihi kapasitas Eagle Hill (2 orang). Tambahkan extra bed atau unit.',
    );
  });
});

describe('validateDiscount / validateDownPayment', () => {
  it('diskon sama dengan total boleh, lebih tidak', () => {
    expect(validateDiscount(100, 100)).toBeNull();
    expect(validateDiscount(100, 101)).toBe(
      'Diskon tidak boleh melebihi total harga.',
    );
  });
  it('DP sama dengan total boleh, lebih tidak', () => {
    expect(validateDownPayment(100, 100)).toBeNull();
    expect(validateDownPayment(100, 101)).toBe(
      'Nominal DP tidak boleh melebihi total reservasi.',
    );
  });
});

describe('validateChildrenCapacity', () => {
  it('membatasi anak sampai kapasitas + extra bed', () => {
    expect(validateChildrenCapacity(3, 2, 1, 'Eagle Hill')).toBeNull();
    expect(validateChildrenCapacity(19, 2, 0, 'Eagle Hill')).toBe(
      'Jumlah anak maksimal 2 untuk Eagle Hill. Anak usia 6 tahun ke atas dihitung sebagai dewasa.',
    );
  });
});
