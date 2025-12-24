import { useMemo } from 'react';
import SimpleGST1 from './SimpleGST1';
import SimpleGST1Variant1 from './SimpleGST1Variant1';
import SimpleGST1Variant2 from './SimpleGST1Variant2';
import SimpleGST1Variant3 from './SimpleGST1Variant3';
import SimpleGSTTemp2 from './SimpleGSTTemp2';
import { TEMPLATE_TYPES, getDefaultTemplate } from '../../../lib/invoiceTemplates';

/**
 * Template Renderer Component
 * Selects and renders the appropriate invoice template based on company settings
 */
export default function TemplateRenderer({ invoice, company, partyLedger, items, settings = {} }) {
  const templateName = settings.template_name || company?.compliance?.invoice_template?.template_name;
  const printSize = settings.print_size || company?.compliance?.invoice_template?.print_size || 'A4';
  
  const templateSettings = useMemo(() => ({
    template_name: templateName || getDefaultTemplate().id,
    print_size: printSize,
    show_logo: settings.show_logo !== undefined ? settings.show_logo : (company?.compliance?.invoice_template?.show_logo !== false),
    show_qr_code: settings.show_qr_code !== undefined ? settings.show_qr_code : (company?.compliance?.invoice_template?.show_qr_code !== false),
    show_bank_details: settings.show_bank_details !== undefined ? settings.show_bank_details : (company?.compliance?.invoice_template?.show_bank_details !== false),
    ...(company?.compliance?.invoice_template || {}),
  }), [templateName, printSize, settings, company]);

  const templateProps = {
    invoice,
    company,
    partyLedger,
    items,
    settings: templateSettings,
  };

  // Render appropriate template based on template_name
  switch (templateSettings.template_name) {
    case TEMPLATE_TYPES.SIMPLE_GST_1:
      return <SimpleGST1 {...templateProps} />;
    
    case TEMPLATE_TYPES.SIMPLE_GST_1_VARIANT_1:
      return <SimpleGST1Variant1 {...templateProps} />;
    
    case TEMPLATE_TYPES.SIMPLE_GST_1_VARIANT_2:
      return <SimpleGST1Variant2 {...templateProps} />;
    
    case TEMPLATE_TYPES.SIMPLE_GST_1_VARIANT_3:
      return <SimpleGST1Variant3 {...templateProps} />;
    
    case TEMPLATE_TYPES.SIMPLE_GST_TEMP_2:
      return <SimpleGSTTemp2 {...templateProps} />;
    
    default:
      return <SimpleGST1 {...templateProps} />;
  }
}

