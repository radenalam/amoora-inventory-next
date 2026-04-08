'use client';

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'Helvetica' },
    { src: 'Helvetica-Bold', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 50,
    color: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 24,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
    color: '#1a1a1a',
  },
  companyInfo: {
    fontSize: 9,
    color: '#666666',
    maxWidth: 250,
  },
  invoiceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e5e7eb',
    textTransform: 'uppercase',
    letterSpacing: 4,
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#1a1a1a',
    textAlign: 'right',
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#666666',
    marginTop: 6,
    textAlign: 'right',
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  infoGrid: {
    flexDirection: 'row',
    marginTop: 24,
  },
  infoCol: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    fontSize: 9,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#1a1a1a',
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 0,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#1a1a1a',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    paddingTop: 10,
    paddingBottom: 10,
  },
  descriptionCell: { flex: 3, fontSize: 9 },
  qtyCell: { flex: 1, fontSize: 9, textAlign: 'center' },
  priceCell: { flex: 1.5, fontSize: 9, textAlign: 'right' },
  totalCell: { flex: 1.5, fontSize: 9, textAlign: 'right', fontWeight: 'bold' },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  summaryBox: {
    width: 280,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 4,
    fontSize: 9,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 2,
    borderTopColor: '#1a1a1a',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 60,
  },
  footerCol: {
    flex: 1,
  },
  footerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  notesText: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.5,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#999999',
    width: 160,
    marginTop: 50,
    marginBottom: 6,
  },
  signerName: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  signerCompany: {
    fontSize: 8,
    color: '#666666',
  },
});

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

interface InvoicePDFProps {
  invoice: any;
  settings: any;
}

export default function InvoicePDF({ invoice, settings }: InvoicePDFProps) {
  const totalQty = invoice.items.reduce((sum: number, item: any) => sum + item.qty, 0);
  const discountAmount = invoice.discountType === 'percent'
    ? invoice.subtotal * (invoice.discountValue / 100)
    : invoice.discountValue;
  const afterDiscount = invoice.subtotal - discountAmount;
  const taxAmount = invoice.taxType === 'percent'
    ? afterDiscount * (invoice.taxValue / 100)
    : invoice.taxValue;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{settings.name || 'Amoora Couture'}</Text>
            <Text style={styles.companyInfo}>{settings.address || ''}</Text>
            <Text style={styles.companyInfo}>Telp: {settings.phone || ''}</Text>
            <Text style={styles.companyInfo}>Email: {settings.email || ''}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceNo}>{invoice.invoiceNo}</Text>
            <Text style={styles.invoiceMeta}>Tanggal: {formatDate(invoice.date)}</Text>
            {invoice.dueDate && (
              <Text style={styles.invoiceMeta}>Jatuh Tempo: {formatDate(invoice.dueDate)}</Text>
            )}
          </View>
        </View>

        {/* Client & Payable Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>Invoice For:</Text>
            <Text style={styles.clientName}>{invoice.invoiceFor}</Text>
            <Text style={styles.clientDetail}>{invoice.customerAddress || ''}</Text>
            {invoice.customerPhone && (
              <Text style={styles.clientDetail}>Telp: {invoice.customerPhone}</Text>
            )}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.sectionLabel}>Payable To:</Text>
            <Text style={styles.clientName}>{invoice.payableTo}</Text>
            {invoice.poNumber && (
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Text style={{ color: '#666666' }}>PO Number:</Text>
                <Text style={{ fontWeight: 'bold' }}>{invoice.poNumber}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={{ color: '#666666' }}>Payment Method:</Text>
              <Text style={{ fontWeight: 'bold' }}>{invoice.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Items Table */}
        <View style={{ marginTop: 30 }}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCell]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.priceCell]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.totalCell]}>Total</Text>
          </View>
          {invoice.items.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.descriptionCell}>{item.description}</Text>
              <Text style={styles.qtyCell}>{item.qty}</Text>
              <Text style={styles.priceCell}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.totalCell}>
                {formatCurrency(item.total || item.qty * item.unitPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666666' }}>Total Qty</Text>
              <Text style={{ fontWeight: 'bold' }}>{totalQty}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: '#666666' }}>Subtotal</Text>
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            {invoice.discountValue > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#dc2626' }}>
                  Discount {invoice.discountType === 'percent' ? `(${invoice.discountValue}%)` : ''}
                </Text>
                <Text style={{ color: '#dc2626' }}>-{formatCurrency(discountAmount)}</Text>
              </View>
            )}
            {invoice.taxValue > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#666666' }}>
                  Tax {invoice.taxType === 'percent' ? `(${invoice.taxValue}%)` : ''}
                </Text>
                <Text style={{ fontWeight: 'bold' }}>+{formatCurrency(taxAmount)}</Text>
              </View>
            )}
            {invoice.shipping > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#666666' }}>Shipping</Text>
                <Text style={{ fontWeight: 'bold' }}>+{formatCurrency(invoice.shipping)}</Text>
              </View>
            )}
            {invoice.downPayment > 0 && (
              <View style={styles.summaryRow}>
                <Text style={{ color: '#2563eb' }}>Down Payment</Text>
                <Text style={{ color: '#2563eb' }}>-{formatCurrency(invoice.downPayment)}</Text>
              </View>
            )}
            <View style={styles.summaryTotalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCol}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 6 }}>Notes:</Text>
            <Text style={styles.notesText}>{invoice.notes || ''}</Text>
          </View>
          <View style={styles.footerRight}>
            <Text style={{ fontSize: 9 }}>Hormat Kami,</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signerName}>{settings.signerName || ''}</Text>
            <Text style={styles.signerCompany}>{settings.name || ''}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
