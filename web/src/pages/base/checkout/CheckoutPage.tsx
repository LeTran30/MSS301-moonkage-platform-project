import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routes, provinceCodeOf } from '@/shared/config';
import { toast } from '@/shared/ui';
import { useAction } from '@/shared/lib';
import { useCart, clearCart } from '@/entities/cart';
import { CartSummary } from '@/entities/cart';
import { useCurrentUser } from '@/entities/user';
import { orderStore, type Order } from '@/entities/order';
import {
  InvoiceRequestForm,
  PaymentMethodPanel,
  ShippingAddressForm,
  useCheckout,
} from '@/features/checkout';
import styles from './CheckoutPage.module.css';

/** Wire shape of `com.moonkage.order.dto.request.CreateCheckoutRequest.InvoiceInfoRequest`. */
interface CheckoutInvoiceInfo {
  name: string;
  taxCode: string;
  address: string;
  email: string;
}

export function CheckoutPage() {
  const cart = useCart();
  const user = useCurrentUser();
  const navigate = useNavigate();
  const { busy, run, error } = useAction();
  const checkoutOrder = useCheckout();

  const [receiver, setReceiver] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState('180 Triệu Việt Vương, Hai Bà Trưng');
  const [provinceCode, setProvinceCode] = useState(() => provinceCodeOf('Hà Nội'));

  // Hóa đơn doanh nghiệp (FR-09, FR-24: nhập 1 lần cho mọi đơn trong lượt thanh toán)
  const [needInvoice, setNeedInvoice] = useState(false);
  const [companyName, setCompanyName] = useState('Công ty Cổ phần Công nghệ Aurora Global');
  const [taxCode, setTaxCode] = useState('0109988776');
  const [companyAddress, setCompanyAddress] = useState(
    'Tầng 18, Tòa tháp Capital Place, 29 Liễu Giai, Hà Nội'
  );
  const [companyEmail, setCompanyEmail] = useState('finance@auroraglobal.vn');

  const subtotal = cart.groups.reduce(
    (acc, g) => acc + g.items.reduce((s, it) => s + it.price * it.quantity, 0),
    0
  );
  const totalShipping = cart.groups.reduce((acc, g) => acc + g.shippingFee, 0);
  const total = subtotal + totalShipping;

  function handleProceedToPayment() {
    if (!receiver.trim() || !phone.trim() || !address.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin nhận hàng.');
      return;
    }
    if (!/^0\d{9}$/.test(phone.trim())) {
      toast.error('Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.');
      return;
    }

    void run(async () => {
      const invoiceInfo: CheckoutInvoiceInfo | undefined = needInvoice
        ? { name: companyName, taxCode, address: companyAddress, email: companyEmail }
        : undefined;

      // Backend FR-09 / BR-29: POST /api/checkouts giữ kho và trả link VNPay.
      const checkout = await checkoutOrder({
        recipientName: receiver.trim(),
        recipientPhone: phone.trim(),
        provinceCode,
        addressDetail: address.trim(),
        invoiceInfo,
      });

      // Đơn chỉ tồn tại sau khi thanh toán thành công; bản ghi cục bộ giữ cho UI demo.
      const createdOrders: Order[] = cart.groups.map((group) => ({
        id: checkout.checkoutId,
        type: 'RETAIL',
        buyerId: user.id,
        buyerName: user.name,
        vendorId: group.vendorId,
        vendorName: group.vendorName,
        createdAt: new Date().toISOString(),
        subtotal: group.items.reduce((s, it) => s + it.price * it.quantity, 0),
        shippingFee: group.shippingFee,
        total: group.items.reduce((s, it) => s + it.price * it.quantity, 0) + group.shippingFee,
        status: 'PAID',
        items: group.items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        })),
        shippingAddress: { receiver, phone, address, province: provinceCode },
        disputeDeadline: new Date(Date.now() + 3 * 86400000).toISOString(),
        hasInvoice: needInvoice,
        invoiceCompanyInfo: invoiceInfo,
      }));

      orderStore.set((prev) => [...createdOrders, ...prev]);
      clearCart();

      // Chuyển sang cổng VNPay (M4.2, Flow 1).
      navigate(routes.gateway.vnpay(checkout.paymentId), {
        state: {
          paymentId: checkout.paymentId,
          checkoutId: checkout.checkoutId,
          amount: checkout.totalAmount || total,
          orderIds: createdOrders.map((o) => o.id),
          type: 'RETAIL',
        },
      });
    });
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Thanh toán đơn hàng (M4.1, Flow 1)</h1>
      <p className={styles.subtitle}>
        Xác nhận thông tin nhận hàng và hóa đơn cho {cart.groups.length} kiện hàng.
      </p>

      <div className={styles.grid}>
        <div className={styles.formCol}>
          <ShippingAddressForm
            receiver={receiver}
            phone={phone}
            address={address}
            provinceCode={provinceCode}
            onReceiverChange={setReceiver}
            onPhoneChange={setPhone}
            onAddressChange={setAddress}
            onProvinceCodeChange={setProvinceCode}
          />

          <InvoiceRequestForm
            orderCount={cart.groups.length}
            needInvoice={needInvoice}
            companyName={companyName}
            taxCode={taxCode}
            companyAddress={companyAddress}
            companyEmail={companyEmail}
            onNeedInvoiceChange={setNeedInvoice}
            onCompanyNameChange={setCompanyName}
            onTaxCodeChange={setTaxCode}
            onCompanyAddressChange={setCompanyAddress}
            onCompanyEmailChange={setCompanyEmail}
          />

          <PaymentMethodPanel />
        </div>

        {/* Tóm tắt thanh toán */}
        <aside className={styles.summaryCol}>
          <CartSummary
            groups={cart.groups}
            subtotal={subtotal}
            totalShipping={totalShipping}
            total={total}
            busy={busy}
            error={error}
            onProceed={handleProceedToPayment}
          />
        </aside>
      </div>
    </div>
  );
}
