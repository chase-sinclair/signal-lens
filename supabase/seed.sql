insert into seller_companies (name, pack, description, website)
values (
  'CrowdStrike',
  'Cybersecurity Pack',
  'Cloud-native cybersecurity platform focused on endpoint protection, threat intelligence, identity protection, and incident response.',
  'https://www.crowdstrike.com'
)
on conflict (name) do update set
  pack = excluded.pack,
  description = excluded.description,
  website = excluded.website;

insert into signal_modules (
  name,
  description,
  default_keywords,
  strong_trigger_examples,
  weak_signal_examples
)
values
(
  'Cybersecurity Incident',
  'Concrete disclosures of unauthorized access, ransomware, data exfiltration, security incidents, and remediation costs.',
  array['unauthorized access','cyber incident','cybersecurity incident','ransomware','data breach','data exfiltration','customer data','incident response','remediation','information security','cybersecurity risks','cyber threats'],
  array['We experienced unauthorized access to customer data.','We incurred costs related to a cybersecurity incident.','A ransomware attack disrupted operations.'],
  array['Cybersecurity risks may affect our business.','We rely on information systems and may face cyber threats.']
),
(
  'Board-Level Cyber Risk',
  'Disclosures that point to board, audit committee, regulatory, legal, or governance attention around cyber risk.',
  array['board','audit committee','risk committee','cyber risk','regulatory inquiry','legal proceedings','material weakness','security controls','internal control','governance','risk management'],
  array['We identified a material weakness related to information security controls.','The board is overseeing remediation of a cybersecurity incident.'],
  array['Our board oversees risk management generally.','We may be subject to regulation.']
),
(
  'Identity / Access Risk',
  'Signals involving credential compromise, identity access failures, account takeover, privilege misuse, or access control remediation.',
  array['identity compromise','credential','access control','account takeover','privileged access','multi-factor','authentication','unauthorized user','permissions','unauthorized access'],
  array['Compromised credentials enabled unauthorized access.','We are remediating access control deficiencies.'],
  array['We use authentication controls.','Employees may misuse access.']
)
on conflict (name) do update set
  description = excluded.description,
  default_keywords = excluded.default_keywords,
  strong_trigger_examples = excluded.strong_trigger_examples,
  weak_signal_examples = excluded.weak_signal_examples;

insert into seller_company_profiles (
  seller_company_id,
  products_summary,
  buyer_personas,
  sales_motions,
  outreach_sensitivity_rules
)
select
  sc.id,
  'CrowdStrike sells endpoint detection and response, identity threat protection, threat intelligence, incident response, and board-level cyber risk visibility.',
  array['CISO','CIO','VP Security Operations','General Counsel','Risk Committee / Board Sponsor'],
  array['Route to Enterprise Security AE and Security Solutions Engineer.','Lead with incident readiness, threat visibility, endpoint protection, and board-level cyber risk reporting.'],
  'For breach-related filings, avoid aggressive outreach language. Use resilience, readiness, and risk governance language instead.'
from seller_companies sc
where sc.name = 'CrowdStrike'
on conflict (seller_company_id) do update set
  products_summary = excluded.products_summary,
  buyer_personas = excluded.buyer_personas,
  sales_motions = excluded.sales_motions,
  outreach_sensitivity_rules = excluded.outreach_sensitivity_rules;

insert into seller_company_signal_modules (
  seller_company_id,
  signal_module_id,
  custom_keywords,
  custom_strong_triggers,
  custom_weak_triggers,
  priority_weight
)
select
  sc.id,
  sm.id,
  array[]::text[],
  array[]::text[],
  array[]::text[],
  case sm.name
    when 'Cybersecurity Incident' then 1.5
    when 'Identity / Access Risk' then 1.2
    else 1.0
  end
from seller_companies sc
cross join signal_modules sm
where sc.name = 'CrowdStrike'
  and sm.name in ('Cybersecurity Incident','Board-Level Cyber Risk','Identity / Access Risk')
on conflict (seller_company_id, signal_module_id) do update set
  priority_weight = excluded.priority_weight;
