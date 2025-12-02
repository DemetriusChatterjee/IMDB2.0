import { Film, Palette, Calendar, Lightbulb } from 'lucide-react'
import '../styles/TagDisplay.css'

function TagDisplay({ tags }) {
  const getTagIcon = (type) => {
    switch (type) {
      case 'genre':
        return <Film size={14} />
      case 'visual':
        return <Palette size={14} />
      case 'temporal':
        return <Calendar size={14} />
      case 'theme':
        return <Lightbulb size={14} />
      default:
        return null
    }
  }

  const getTagColor = (type) => {
    const colors = {
      genre: 'blue',
      visual: 'purple',
      temporal: 'green',
      theme: 'orange'
    }
    return colors[type] || 'gray'
  }

  const getStrengthLabel = (strength) => {
    if (strength >= 0.8) return 'strong'
    if (strength >= 0.6) return 'moderate'
    return 'weak'
  }

  return (
    <div className="tag-display">
      {tags.map((tag, index) => (
        <div
          key={index}
          className={`tag tag-${getTagColor(tag.type)} tag-${getStrengthLabel(tag.strength)}`}
          title={`${tag.label} (${Math.round(tag.strength * 100)}% confidence)`}
        >
          <span className="tag-icon">
            {getTagIcon(tag.type)}
          </span>
          <span className="tag-label">{tag.label}</span>
          <div
            className="tag-strength-bar"
            style={{ width: `${tag.strength * 100}%` }}
          />
        </div>
      ))}
    </div>
  )
}

export default TagDisplay
