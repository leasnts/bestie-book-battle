/**
 * Script d'ajout du WidgetRefreshModule au projet Xcode.
 *
 * Ce script fait 2 choses :
 * 1. Crée les fichiers Swift et Objective-C dans ios/bestiebookbattle/
 * 2. Les ajoute comme sources compilables dans le projet Xcode (.pbxproj)
 *
 * On utilise la librairie `xcode` (npm) qui sait lire et modifier
 * les fichiers .pbxproj (le "catalogue" du projet Xcode).
 *
 * Usage : node scripts/add-widget-refresh-module.js
 */

const xcode = require('xcode');
const fs = require('fs');
const path = require('path');

const PROJECT_PATH = path.join(
  __dirname, '..', 'ios', 'bestiebookbattle.xcodeproj', 'project.pbxproj'
);
const APP_DIR = path.join(__dirname, '..', 'ios', 'bestiebookbattle');

const SWIFT_CODE = `import Foundation
import WidgetKit

@objc(WidgetRefreshModule)
class WidgetRefreshModule: NSObject {

  @objc
  func reloadAllTimelines() {
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool { false }
}
`;

const OBJC_CODE = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(WidgetRefreshModule, NSObject)

RCT_EXTERN_METHOD(reloadAllTimelines)

@end
`;

const swiftPath = path.join(APP_DIR, 'WidgetRefreshModule.swift');
const objcPath = path.join(APP_DIR, 'WidgetRefreshModule.m');

fs.writeFileSync(swiftPath, SWIFT_CODE);
console.log('✓ Créé :', swiftPath);

fs.writeFileSync(objcPath, OBJC_CODE);
console.log('✓ Créé :', objcPath);

const project = xcode.project(PROJECT_PATH);

project.parseSync();

const mainTarget = project.getFirstTarget();
if (!mainTarget) {
  console.error('✗ Impossible de trouver la target principale');
  process.exit(1);
}

const targetUuid = mainTarget.uuid;
const appGroupKey = project.findPBXGroupKey({ name: 'bestiebookbattle' })
  || project.findPBXGroupKey({ path: 'bestiebookbattle' });

const fileRefs = project.pbxFileReferenceSection();
const alreadyExists = Object.values(fileRefs).some(
  f => f && (f.name === 'WidgetRefreshModule.swift' || f.path === 'WidgetRefreshModule.swift')
);

if (alreadyExists) {
  console.log('→ Les fichiers sont déjà dans le projet Xcode, rien à faire.');
  process.exit(0);
}

project.addSourceFile(
  'bestiebookbattle/WidgetRefreshModule.swift',
  { target: targetUuid },
  appGroupKey
);
console.log('✓ Ajouté WidgetRefreshModule.swift au projet Xcode');

project.addSourceFile(
  'bestiebookbattle/WidgetRefreshModule.m',
  { target: targetUuid },
  appGroupKey
);
console.log('✓ Ajouté WidgetRefreshModule.m au projet Xcode');

fs.writeFileSync(PROJECT_PATH, project.writeSync());
console.log('✓ project.pbxproj sauvegardé');
console.log('\nTerminé ! Tu peux builder avec : npx expo run:ios');
