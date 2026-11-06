import { useState } from 'react';
import { toast } from '@/shared/ui';
import { openPaymentPage, useAction, useAsync } from '@/shared/lib';
import { toNationalPhone } from '@/shared/utils';
import { addressApi, type Address } from '@/entities/address';
import { useCart } from '@/entities/cart';
import { CartSummary } from '@/entities/cart';
import { setDeliveryProvince, useDeliveryProvinceCode } from '@/entities/region';
import { useCurrentUser } from '@/entities/user';
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
  const { busy, run, error } = useAction();
  const checkoutOrder = useCheckout();

  // The cart was priced to the delivery province (BR-30), so the order ships there.
  const provinceCode = useDeliveryProvinceCode();
  const [receiver, setReceiver] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState('');

  // FR-03: start from the buyer's saved address in that province, the default one first.
  const savedAddresses = useAsync<Address[]>(() => addressApi.list(), []);
  const [prefilled, setPrefilled] = useState(false);
  if (!prefilled && savedAddresses.kind === 'loaded') {
    setPrefilled(true);
    const inProvince = savedAddresses.data.filter((a) => a.provinceCode === provinceCode);
    const saved = inProvince.find((a) => a.isDefault) ?? inProvince[0];
    if (saved) {
      setReceiver(saved.recipientName);
      setPhone(toNationalPhone(saved.recipientPhone));
      setAddress(saved.wardName ? `${saved.detail}, ${saved.wardName}` : saved.detail);
    }
  }

  // Hóa đơn doanh nghiệp (FR-09, FR-24: nhập 1 lần cho mọi đơn trong lượt thanh toán)
  const [needInvoice, setNeedInvoice] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

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

      // FR-09, BR-25: the orders exist once the IPN marks the payment paid; the
      // server empties the cart then. VNPay brings the buyer back to M4.3.
      openPaymentPage(checkout.paymentUrl);
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
            onProvinceCodeChange={setDeliveryProvince}
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
