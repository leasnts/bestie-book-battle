Pod::Spec.new do |s|
  s.name           = 'PageText'
  s.version        = '1.0.0'
  s.summary        = 'Lire le texte d’une photo de page (Vision)'
  s.author         = ''
  s.homepage       = 'https://github.com/leasnts/bestie-book-battle'
  s.platforms      = { :ios => '16.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.swift'
end
