import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NewQuoteRequestPage } from '../NewQuoteRequestPage';

/**
 * Validate phía client của form yêu cầu báo giá (FR-16).
 *
 * Trước khi có validate, form gửi thẳng lên API: một yêu cầu thiếu số lượng
 * hoặc thiếu địa chỉ vẫn tạo ra một yêu cầu rác ở phía server.
 */
vi.mock('@/features/request-quote', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/request-quote')>();
  return {
    ...actual,
    useCreateQuoteRequest: () => vi.fn().mockResolvedValue({ id: 'REQ_test' }),
  };
});

// Danh mục vỏ & nhân đọc từ máy chủ; form chỉ cần một danh mục rỗng để render.
vi.mock('@/entities/product', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/product')>();
  return {
    ...actual,
    useTaxonomyCatalog: () => ({ kind: 'loaded' }),
  };
});

vi.mock('@/entities/user', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/user')>();
  return {
    ...actual,
    useCurrentUser: () => ({
      id: 'usr_test',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
      role: 'BUYER',
      nfcStatus: 'VERIFIED',
    }),
  };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <NewQuoteRequestPage />
    </MemoryRouter>,
  );
}

/** Số lượng hộp. */
const quantity = () => screen.getByRole('spinbutton', { name: /Số lượng hộp cần đặt/i });
/** Nút gửi yêu cầu. */
const submit = () => screen.getByRole('button', { name: /Gửi yêu cầu báo giá/i });

describe('NewQuoteRequestPage — validate form', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('số lượng rỗng thì báo lỗi và không điều hướng', async () => {
    renderPage();

    await userEvent.clear(quantity());
    await userEvent.click(submit());

    expect(
      await screen.findByText(/Số lượng hộp cần đặt không được để trống/i),
    ).toBeInTheDocument();
  });

  it('số lượng dưới 20 hộp thì báo lỗi ngưỡng tối thiểu', async () => {
    renderPage();

    await userEvent.clear(quantity());
    await userEvent.type(quantity(), '5');
    await userEvent.click(submit());

    expect(await screen.findByText(/tối thiểu từ 20 hộp/i)).toBeInTheDocument();
  });

  it('số điện thoại sai định dạng thì báo lỗi', async () => {
    renderPage();

    const phone = screen.getByRole('textbox', {
      name: /Số điện thoại người nhận/i,
    });
    await userEvent.clear(phone);
    await userEvent.type(phone, '123');
    await userEvent.click(submit());

    expect(await screen.findByText(/Số điện thoại Việt Nam/i)).toBeInTheDocument();
  });

  it('địa chỉ rỗng thì báo lỗi', async () => {
    renderPage();

    const address = screen.getByRole('textbox', {
      name: /Địa chỉ nhận hàng chi tiết/i,
    });
    await userEvent.clear(address);
    await userEvent.click(submit());

    expect(
      await screen.findByText(/Địa chỉ nhận hàng chi tiết không được để trống/i),
    ).toBeInTheDocument();
  });

  it('người nhận rỗng thì báo lỗi', async () => {
    renderPage();

    const name = screen.getByRole('textbox', { name: /^Người nhận/i });
    await userEvent.clear(name);
    await userEvent.click(submit());

    expect(await screen.findByText(/Người nhận không được để trống/i)).toBeInTheDocument();
  });

  it('sửa lại thì lỗi tương ứng biến mất', async () => {
    renderPage();

    await userEvent.clear(quantity());
    await userEvent.click(submit());
    expect(
      await screen.findByText(/Số lượng hộp cần đặt không được để trống/i),
    ).toBeInTheDocument();

    await userEvent.type(quantity(), '500');
    await waitFor(() =>
      expect(
        screen.queryByText(/Số lượng hộp cần đặt không được để trống/i),
      ).not.toBeInTheDocument(),
    );
  });
});
