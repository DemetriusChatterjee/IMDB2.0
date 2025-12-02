import { useState } from 'react'
import { Sliders, Info, Brain, Eye, Headphones, FileText } from 'lucide-react'
import '../styles/WeightPanel.css'

function WeightPanel({ onWeightChange, selectedMovie, initialWeights }) {
  const [weights, setWeights] = useState(initialWeights || {
    narrative: 0.4,    // Text analysis from Gemini
    visual: 0.35,      // CLIP visual features
    audio: 0.25        // Audio features
  })

  const [showTooltip, setShowTooltip] = useState(null)

  const handleWeightChange = (feature, value) => {
    const newWeights = { ...weights, [feature]: value }

    // Normalize weights to sum to 1.0
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0)
    if (total > 0) {
      Object.keys(newWeights).forEach(key => {
        newWeights[key] = newWeights[key] / total
      })
    }

    setWeights(newWeights)
    onWeightChange(newWeights)
  }

  const resetWeights = () => {
    const defaultWeights = {
      narrative: 0.4,
      visual: 0.35,
      audio: 0.25
    }
    setWeights(defaultWeights)
    onWeightChange(defaultWeights)
  }

  const featureDescriptions = {
    narrative: {
      icon: <Brain size={20} />,
      title: "Narrative Analysis",
      description: "AI-powered story analysis from Gemini including plot, themes, character development, and storytelling structure.",
      examples: "Drama themes, action sequences, romantic elements, plot complexity"
    },
    visual: {
      icon: <Eye size={20} />,
      title: "Visual Features",
      description: "Computer vision analysis using CLIP model for cinematography, color palettes, visual style, and scene composition.",
      examples: "Lighting style, color schemes, camera work, visual effects, set design"
    },
    audio: {
      icon: <Headphones size={20} />,
      title: "Audio Features",
      description: "Sound analysis including music tempo, spectral patterns, audio mood, and soundtrack characteristics.",
      examples: "Music genre, tempo, intensity, dialogue patterns, sound effects"
    }
  }

  return (
    <div className="weight-panel">
      <div className="panel-header">
        <Sliders size={24} />
        <h2>AI Model Configuration</h2>
      </div>

      <div className="feature-description">
        <p>Adjust how much each AI feature influences movie recommendations:</p>
      </div>

      <div className="weight-controls">
        {Object.entries(weights).map(([feature, weight]) => {
          const featureInfo = featureDescriptions[feature]
          return (
            <div key={feature} className="weight-control">
              <div className="feature-header">
                <div className="feature-icon">
                  {featureInfo.icon}
                </div>
                <div className="feature-info">
                  <h3>{featureInfo.title}</h3>
                  <span className="weight-value">{Math.round(weight * 100)}%</span>
                </div>
                <button
                  className="info-button"
                  onMouseEnter={() => setShowTooltip(feature)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <Info size={16} />
                </button>
              </div>

              <div className="slider-container">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weight}
                  onChange={(e) => handleWeightChange(feature, parseFloat(e.target.value))}
                  className="weight-slider"
                />
                <div className="slider-track">
                  <div
                    className="slider-fill"
                    style={{ width: `${weight * 100}%` }}
                  />
                </div>
              </div>

              {showTooltip === feature && (
                <div className="feature-tooltip">
                  <p className="tooltip-description">{featureInfo.description}</p>
                  <div className="tooltip-examples">
                    <strong>Examples:</strong> {featureInfo.examples}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="panel-actions">
        <button onClick={resetWeights} className="reset-button">
          Reset to Defaults
        </button>

        {selectedMovie && (
          <div className="current-selection">
            <FileText size={16} />
            <span>Finding movies similar to:</span>
            <strong>{selectedMovie.title}</strong>
          </div>
        )}
      </div>

      <div className="feature-summary">
        <h4>How It Works:</h4>
        <ul>
          <li><strong>Narrative:</strong> Gemini AI analyzes story, plot, and themes</li>
          <li><strong>Visual:</strong> CLIP model processes cinematography and style</li>
          <li><strong>Audio:</strong> Librosa extracts music and sound patterns</li>
        </ul>
        <p>Your weights determine how much each feature influences the similarity score.</p>
      </div>
    </div>
  )
}

export default WeightPanel