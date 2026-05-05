#!/usr/bin/env python3
"""
fix-source-names.py
Fixes source file # headers to consistent "<Name> (<@Handle or domain>)" format.

For Twitter: derives handle from filename, applies curated name map.
For web sources: strips URL to bare domain.

Usage:
    python3 source/scripts/fix-source-names.py [--dry-run]
"""
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent
SOURCES_DIR = REPO_ROOT / 'source' / 'sources'

# Curated handle → display name map (handle is CamelCase derived from filename)
# Format: handle_without_at -> "Display Name"
TWITTER_NAMES = {
    'ABC':              'ABC News',
    'AfricaFactsZone':  'Africa Facts Zone',
    'AllSource4':       'All Source Intelligence',
    'AP':               'AP News',
    'ArcGISStoryMaps':  'ArcGIS Story Maps',
    'ArmedForcesPhil':  'Armed Forces Philippines',
    'AuroraIntel':      'Aurora Intel',
    'AusNavy':          'Royal Australian Navy',
    'BatesGill4':       'Bates Gill',
    'BBCBreaking':      'BBC Breaking News',
    'BBCWorld':         'BBC World News',
    'BBGOriginals':     'BBG Originals',
    'BelteleFacts':     'Belteleradio Facts',
    'BeltelFreeAudio':  'Belteleradio Free Audio',
    'Borrowed7Time':    'Borrowed Time OSINT',
    'C4ADS':            'C4ADS',
    'CAJC':             'CA JC Intelligence',
    'Cepa':             'CEPA',
    'ChadObcNews':      'Chad O\'Brien Korea News',
    'ChinaPower':       'China Power CSIS',
    'ChineseEmbInUS':   'Chinese Embassy US',
    'ClashReport':      'Clash Report',
    'ClaudeFB':         'ClaudeFB OSINT',
    'CNN':              'CNN',
    'CNNBrk':           'CNN Breaking News',
    'CNNI':             'CNN International',
    'CoastGuardPH':     'Philippine Coast Guard',
    'CSISKoreaChair':   'CSIS Korea Chair',
    'Dataminr':         'Dataminr',
    'DefenceAust':      'Australian Defence',
    'DetresFA':         'Detresfa OSINT',
    'DPRKNews':         'DPRK News Service',
    'ELINTNews':        'ELINT News',
    'Esri':             'Esri',
    'EsriTraining':     'Esri Training',
    'EsriWater':        'Esri Water Resources',
    'EtienneLH':        'Etienne Leheup OSINT',
    'FAASouth':         'FAA Southern Region',
    'Fleetnumbers':     'FleetNumbers Maritime',
    'FoxNews':          'Fox News',
    'GCapta':           'gCaptain Maritime',
    'HawkEye360':       'HawkEye 360',
    'IanBremmer':       'Ian Bremmer',
    'IMDNewsDesk':      'IMD News',
    'InsideNK':         'Inside North Korea',
    'IMOHQ':            'IMO HQ',
    'IranObserve0':     'Iran Observer',
    'IranSpec':         'Iran Spectrum',
    'JasonMBrodsky':    'Jason Brodsky',
    'JapanJointStaff':  'Japan Joint Staff',
    'JKGarokGov':       'JK Garok',
    'JohnPollock22':    'John Pollock',
    'JosephDempsey':    'Joseph Dempsey',
    'KAngDaily':        'Kang Daily',
    'KCNWT':            'KC NWT',
    'Key2Med':          'Key to Med',
    'KoreaEconInst':    'Korea Economic Institute',
    'KyleBass':         'Kyle Bass',
    'MDA_Space':        'MDA Space',
    'MDASpace':         'MDA Space',
    'MiddleEastEye':    'Middle East Eye',
    'MilitaryLandNet':  'Militaryland',
    'Minhdr18':         'Minhdr18 OSINT',
    'MDAT_GoG':         'MDAT Gulf of Guinea',
    'MNDChina':         'China Ministry of National Defence',
    'MoFAJapan_En':     'Japan MOFA',
    'MoFAJapanEn':      'Japan MOFA',
    'MoNDefense':       'Montenegro MoD',
    'MSCSealift':       'MSC Sealift',
    'MT_Anderson':      'MT Anderson',
    'MyLordBebo':       'My Lord Bebo',
    'NaSCS_PI':         'SCS Probing Initiative',
    'NatlHistShips':    'National Historic Ships',
    'NationalInterest': 'National Interest',
    'NATO_MARCOM':      'NATO Maritime Command',
    'NguyenThiHo88':    'Nguyen Thi Ho',
    'NSACyber':         'NSA Cybersecurity',
    'NSAGov':           'NSA',
    'NTonC':            'NTonC OSINT',
    'NYTimesWorld':     'NYT World',
    'OANR':             'OANR',
    'OANRMilitary':     'OANR Military',
    'OFAC_Alert':       'OFAC Alert',
    'OFACAlert':        'OFAC Alert',
    'OilCfd':           'Oil CFD',
    'OlongapoTimes':    'Olongapo Times',
    'PizzaInWatch':     'Pizza in Watch',
    'Pyongyang_Today':  'Pyongyang Today',
    'RayFunseth':       'Ray Funseth',
    'RayToribo':        'Ray Toribo',
    'RiskStaff':        'Risk Intelligence',
    'Sanctionswatc':    'Sanctions Watch',
    'SanctionsWatch':   'Sanctions Watch',
    'SCMPNews':         'South China Morning Post',
    'SCPandura':        'SC Pandura',
    'SCS_PI':           'SCS Probing Initiative',
    'SeaWatch_Intl':    'Seawatch International',
    'SeawatchIntl':     'Seawatch International',
    'ShipNews':         'Ship News',
    'SimNasr':          'Sim Nasr',
    'SindikasyonTek':   'Sindikasyon Tek',
    'Songss44':         'Songss44',
    'SouthKoreaPro':    'South Korea Pro',
    'TaFarms18':        'TaFarms18',
    'TankerTrackers':   'TankerTrackers',
    'TatarigamiUA':     'Tatarigami Ukraine',
    'TaiwanNewsEN':     'Taiwan News',
    'TheKorea_Times':   'Korea Times',
    'TheKoreaView':     'The Korea View',
    'ThePacificBrief':  'The Pacific Brief',
    'TheWarZoneWire':   'The War Zone Wire',
    'The_Lookout_N':    'The Lookout North',
    'UN':               'United Nations',
    'UANI':             'UANI',
    'UnitedNations':    'United Nations',
    'US5thFleet':       'US 5th Fleet',
    'US7thFleet':       'US 7th Fleet',
    'USFleetForces':    'US Fleet Forces',
    'USForcesJapan':    'US Forces Japan',
    'USNavy':           'US Navy',
    'USPacificFleet':   'US Pacific Fleet',
    'USTreasury':       'US Treasury',
    'VantorTech':       'Vantor Tech',
    'WarshipCam':       'Warship Cam',
    'WarTV7890':        'War TV',
    'WindwardAI':       'Windward AI',
    'XHNews':           'Xinhua News',
    'XKorea':           'X Korea',
    'XNews':            'X News',
    'YonkosMC':         'Yonkos MC',
    'YortukIsgk':       'Yortuk ISGK',
}

# Webpage/API/RSS source name overrides (filename-stem → display name, domain)
WEB_NAMES = {
    'webpage-windward-ai-blog':          ('Windward AI Blog',       'windward.ai/blog'),
    'webpage-breaking-defense-global':   ('Breaking Defense',       'breakingdefense.com'),
    'webpage-yahoo-world-news':          ('Yahoo News',             'news.yahoo.com'),
    'webpage-cuashub-defense':           ('CUASHUB Defense',        'cuashub.com'),
    'webpage-satellite-today-gov-mil':   ('Satellite Today (DoD)',  'satellite.today'),
}


# Exact handle overrides where auto-CamelCase would be wrong
HANDLE_OVERRIDES = {
    'twitter-abc':              'ABC',
    'twitter-ap':               'AP',
    'twitter-ausnav':           'AusNavy',
    'twitter-bbc-breaking':     'BBCBreaking',
    'twitter-bbc-world':        'BBCWorld',
    'twitter-bbgoriginals':     'BBGOriginals',
    'twitter-beltelfreeaudio':  'BeltelFreeAudio',
    'twitter-beltelefacts':     'BelteleFacts',
    'twitter-c4ads':            'C4ADS',
    'twitter-ca-jc':            'CA_JC',
    'twitter-cepa':             'cepa',
    'twitter-chinapower':       'ChinaP0wer',
    'twitter-cnn':              'CNN',
    'twitter-cnnbrk':           'cnnbrk',
    'twitter-cnni':             'cnni',
    'twitter-coastguard-ph':    'CoastGuardPH',
    'twitter-csis-korea-chair': 'CSISKoreaChair',
    'twitter-defence-aust':     'DefenceAust',
    'twitter-dprk-news':        'DPRK_News',
    'twitter-elint-news':       'ELINTNews',
    'twitter-esri':             'Esri',
    'twitter-esri-training':    'EsriTraining',
    'twitter-esri-water':       'EsriWater',
    'twitter-faa-south':        'FAASouth',
    'twitter-fox-news':         'FoxNews',
    'twitter-foxnews':          'FoxNews',
    'twitter-hawkeye360':       'HawkEye360',
    'twitter-ian-bremmer':      'ianbremmer',
    'twitter-imo-hq':           'IMOHQ',
    'twitter-inside-nk':        'inside_nk',
    'twitter-iran-spectrum':    'IranSpec',
    'twitter-japan-joint-staff':'JapanJointStaff',
    'twitter-jk-garok-gov':     'jkgarokgov',
    'twitter-john-pollock':     'John_Pollock22',
    'twitter-joseph-dempsey':   'JosephDempsey',
    'twitter-kang-daily':       'KAngDaily',
    'twitter-kc-nwt':           'KC_NWT',
    'twitter-key-to-med':       'key2med',
    'twitter-key2med':          'key2med',
    'twitter-korea-times':      'TheKorea_Times',
    'twitter-kyle-bass':        'kyleBass',
    'twitter-kylebass':         'kyleBass',
    'twitter-mdat-gog':         'MDAT_GoG',
    'twitter-middle-east-eye':  'MiddleEastEye',
    'twitter-militaryland':     'Militarylandnet',
    'twitter-minhdr18':         'Minhdr18',
    'twitter-mnd-china':        'MNDChina',
    'twitter-mndchina':         'MNDChina',
    'twitter-mon-defense':      'MoNDefense',
    'twitter-mofa-japan-en':    'MofaJapan_en',
    'twitter-msc-sealift':      'MSCSealift',
    'twitter-mt-anderson':      'MT_Anderson',
    'twitter-my-lord-bebo':     'MyLordBebo',
    'twitter-mylordbebo':       'MyLordBebo',
    'twitter-natl-hist-ships':  'NatlHistShips',
    'twitter-nato-marcom':      'NATO_MARCOM',
    'twitter-national-interest':'NationalInterest',
    'twitter-nsa-cyber':        'NSACyber',
    'twitter-nsa-gov':          'NSAGov',
    'twitter-ntonc':            'ntonc',
    'twitter-nytimesworld':     'nytimesworld',
    'twitter-ofac-alert':       'ofacalert',
    'twitter-oil-cfd':          'OilCfd',
    'twitter-olongapo-times':   'olongapotimes',
    'twitter-pizza-in-watch':   'pizzainwatch',
    'twitter-pizzainwatch':     'pizzainwatch',
    'twitter-ray-funseth':      'RayFunseth',
    'twitter-ray-toribo':       'RayToribo',
    'twitter-risk-staff':       'riskstaff',
    'twitter-sanctions-watch':  'sanctionswatch',
    'twitter-sc-pandura':       'scpandura',
    'twitter-scmp-news':        'scmpnews',
    'twitter-scs-pi':           'SCS_PI',
    'twitter-seawatch-intl':    'seawatch_intl',
    'twitter-ship-news':        'ShipNews',
    'twitter-shipnews':         'ShipNews',
    'twitter-sindikasyon-tek':  'SindikasyonTek',
    'twitter-south-korea-pro':  'southkoreapro',
    'twitter-ta-farms18':       'TaFarms18',
    'twitter-tafarms18':        'TaFarms18',
    'twitter-tanker-trackers':  'TankerTrackers',
    'twitter-tatarigamiua':     'TatarigamiUA',
    'twitter-taiwan-news-en':   'TaiwanNewsEN',
    'twitter-the-korea-view':   'the_koreaview',
    'twitter-the-lookout-north':'The_Lookout_N',
    'twitter-the-war-zone-wire':'thewarzonewire',
    'twitter-un':               'UN',
    'twitter-uani':             'UANI',
    'twitter-united-nations':   'United_Nations',
    'twitter-us-5th-fleet':     'US5thFleet',
    'twitter-us-7th-fleet':     'US7thFleet',
    'twitter-us-fleet-forces':  'USFleetForces',
    'twitter-us-forces-japan':  'USForcesJapan',
    'twitter-us-navy':          'USNavy',
    'twitter-us-pacific-fleet': 'USPacificFleet',
    'twitter-us-treasury':      'USTreasury',
    'twitter-vantor-tech':      'vantortech',
    'twitter-vantortech':       'vantortech',
    'twitter-warship-cam':      'WarshipCam',
    'twitter-war-tv7890':       'WarTV7890',
    'twitter-xinhua-news':      'XHNews',
    'twitter-xkorea':           'XKorea',
    'twitter-xnews':            'XNews',
    'twitter-yonkos-mc':        'YonkosMC',
    'twitter-yonkosmc':         'YonkosMC',
    'twitter-yortuk-isgk':      'YortukIsgk',
    'twitter-yortukisgk':       'YortukIsgk',
}


def filename_to_handle(stem: str) -> str:
    """Convert twitter-foo-bar-baz to FooBarBaz, with overrides for known handles."""
    if stem in HANDLE_OVERRIDES:
        return HANDLE_OVERRIDES[stem]
    parts = stem.replace('twitter-', '').split('-')
    return ''.join(p.capitalize() for p in parts)


def fix_header_line(stem: str, src_type: str, old_header: str) -> str:
    """Return corrected # header line."""
    if src_type == 'twitter':
        handle = filename_to_handle(stem)
        display = TWITTER_NAMES.get(handle, handle)
        return f'# {display} (@{handle})'

    # Web sources
    if stem in WEB_NAMES:
        name, domain = WEB_NAMES[stem]
        return f'# {name} ({domain})'

    # Generic web: keep existing name, just clean parenthetical
    m = re.match(r'^# (.+?)(?:\s+\(.+\))?$', old_header)
    if m:
        name = m.group(1).strip()
        # Try to extract domain from old header
        dm = re.search(r'https?://([^/\s)]+)', old_header)
        if dm:
            domain = dm.group(1).replace('www.', '')
            return f'# {name} ({domain})'
        return f'# {name}'
    return old_header


def process_file(path: Path, dry_run: bool = False) -> tuple[str, str]:
    """Return (old_header, new_header). If same, no change."""
    text = path.read_text(encoding='utf-8')
    lines = text.splitlines()

    # Parse frontmatter to get type
    in_fm = False
    fm_done = False
    src_type = 'twitter' if path.stem.startswith('twitter-') else 'web'
    for line in lines:
        if line.strip() == '---':
            if not in_fm:
                in_fm = True
            else:
                fm_done = True
            continue
        if in_fm and not fm_done:
            if line.startswith('type:'):
                src_type = line.split(':', 1)[1].strip().lower()

    # Find and replace # header
    new_lines = []
    old_header = None
    new_header = None
    header_replaced = False
    for line in lines:
        if not header_replaced and line.startswith('# ') and fm_done:
            old_header = line
            new_header = fix_header_line(path.stem, src_type, line)
            new_lines.append(new_header)
            header_replaced = True
        else:
            new_lines.append(line)

    if old_header == new_header or not header_replaced:
        return (old_header or '', old_header or '')

    if not dry_run:
        path.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')

    return (old_header, new_header)


def main():
    dry_run = '--dry-run' in sys.argv
    files = sorted(SOURCES_DIR.glob('*.md'))
    changed = 0
    for path in files:
        old, new = process_file(path, dry_run=dry_run)
        if old != new:
            action = 'would fix' if dry_run else 'fixed'
            print(f'  {action}: {path.name}')
            print(f'    - {old}')
            print(f'    + {new}')
            changed += 1

    action = 'Would change' if dry_run else 'Changed'
    print(f'\n{action} {changed}/{len(files)} source files.')


if __name__ == '__main__':
    main()
