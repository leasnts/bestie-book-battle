import ExpoModulesCore
import Vision

/// Lire le texte d'une photo de page, ligne par ligne, en français.
/// Chaque ligne revient avec sa place dans l'image (0 → 1, origine en haut à gauche),
/// pour pouvoir la surligner sur la photo.
public class PageTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PageText")

    AsyncFunction("recognize") { (url: URL, promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          let data = try Data(contentsOf: url)
          guard let image = UIImage(data: data), let cgImage = image.cgImage else {
            promise.reject("E_IMAGE", "Image illisible")
            return
          }

          let request = VNRecognizeTextRequest()
          request.recognitionLevel = .accurate
          request.recognitionLanguages = ["fr-FR", "en-US"]
          request.usesLanguageCorrection = true

          // La photo de l'appareil est souvent « tournée » par une étiquette d'orientation
          let handler = VNImageRequestHandler(
            cgImage: cgImage,
            orientation: CGImagePropertyOrientation(image.imageOrientation)
          )
          try handler.perform([request])

          let lines: [[String: Any]] = (request.results ?? []).compactMap { observation in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            return [
              "text": candidate.string,
              "x": box.minX,
              "y": 1 - box.maxY,
              "width": box.width,
              "height": box.height,
            ]
          }
          promise.resolve(lines)
        } catch {
          promise.reject("E_RECOGNIZE", error.localizedDescription)
        }
      }
    }
  }
}

extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
