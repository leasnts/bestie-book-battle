import Foundation
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
