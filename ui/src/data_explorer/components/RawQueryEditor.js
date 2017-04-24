import React, {PropTypes, Component} from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import Dropdown from 'src/shared/components/Dropdown'
import LoadingDots from 'src/shared/components/LoadingDots'
import TemplateDrawer from 'src/shared/components/TemplateDrawer'
import {QUERY_TEMPLATES} from 'src/data_explorer/constants'
import {TEMPLATE_MATCHER} from 'src/dashboards/constants'

class RawQueryEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: this.props.query,
      isTemplating: false,
      selectedTemplate: {
        tempVar: '',
      },
    }

    this.handleKeyDown = ::this.handleKeyDown
    this.handleChange = ::this.handleChange
    this.handleUpdate = ::this.handleUpdate
    this.handleChooseTemplate = ::this.handleChooseTemplate
    this.handleCloseDrawer = ::this.handleCloseDrawer
    this.findTempVar = ::this.findTempVar
    this.handleTemplateReplace = ::this.handleTemplateReplace
    this.handleMouseOverTempVar = ::this.handleMouseOverTempVar
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.query !== nextProps.query) {
      this.setState({value: nextProps.query})
    }
  }

  handleCloseDrawer() {
    this.setState({isTemplating: false})
  }

  handleMouseOverTempVar(template) {
    this.handleTemplateReplace(template)
  }

  handleKeyDown(e) {
    const {isTemplating, value} = this.state

    if (isTemplating) {
      if (e.key === ('ArrowRight' || 'ArrowDown')) {
        e.preventDefault()

        const tempVar = this.findTempVar('next')
        this.handleTemplateReplace(tempVar)
      }

      if (e.key === ('ArrowLeft' || 'ArrowUp')) {
        e.preventDefault()

        const tempVar = this.findTempVar('previous')
        this.handleTemplateReplace(tempVar)
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const start = this.editor.selectionStart
        const end = this.editor.selectionEnd
        this.editor.setSelectionRange(start, end)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      this.setState({value, isTemplating: false})
    } else if (e.key === 'Enter') {
      this.handleUpdate()
    }
  }

  handleTemplateReplace(selectedTemplate) {
    const {selectionStart, value} = this.editor
    const {tempVar} = selectedTemplate

    let templatedValue
    const matched = value.match(TEMPLATE_MATCHER)
    if (matched) {
      templatedValue = value.replace(TEMPLATE_MATCHER, `:${tempVar}`)
    }

    const diffInLength = tempVar.length - matched[0].length

    this.setState({value: templatedValue, selectedTemplate}, () =>
      this.editor.setSelectionRange(
        selectionStart + diffInLength + 1,
        selectionStart + diffInLength + 1
      )
    )
  }

  findTempVar(direction) {
    const {templates} = this.props
    const {selectedTemplate} = this.state

    const i = _.findIndex(templates, selectedTemplate)
    const lastIndex = templates.length - 1

    if (i >= 0) {
      if (direction === 'next') {
        return templates[(i + 1) % templates.length]
      }

      if (direction === 'previous') {
        if (i === 0) {
          return templates[lastIndex]
        }

        return templates[i - 1]
      }
    }

    return templates[0]
  }

  handleChange() {
    const value = this.editor.value

    if (value.match(TEMPLATE_MATCHER)) {
      // maintain cursor poition
      const start = this.editor.selectionStart
      const end = this.editor.selectionEnd
      this.setState({isTemplating: true, value})
      this.editor.setSelectionRange(start, end)
    } else {
      this.setState({isTemplating: false, value})
    }
  }

  handleUpdate() {
    this.props.onUpdate(this.state.value)
  }

  handleChooseTemplate(template) {
    this.setState({value: template.query})
  }

  handleSelectTempVar(tempVar) {
    this.setState({selectedTemplate: tempVar})
  }

  render() {
    const {config: {status}, templates} = this.props
    const {value, isTemplating, selectedTemplate} = this.state

    return (
      <div className="raw-text">
        {isTemplating
          ? <TemplateDrawer
              templates={templates}
              selected={selectedTemplate}
              handleClickOutside={this.handleCloseDrawer}
              handleMouseOverTempVar={this.handleMouseOverTempVar}
            />
          : null}
        <textarea
          className="raw-text--field"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleUpdate}
          ref={editor => (this.editor = editor)}
          value={value}
          placeholder="Enter a query or select database, measurement, and field below and have us build one for you..."
          autoComplete="off"
          spellCheck="false"
        />
        {this.renderStatus(status)}
        <Dropdown
          items={QUERY_TEMPLATES}
          selected={'Query Templates'}
          onChoose={this.handleChooseTemplate}
          className="query-template"
        />
      </div>
    )
  }

  renderStatus(status) {
    if (!status) {
      return <div className="raw-text--status" />
    }

    if (status.loading) {
      return (
        <div className="raw-text--status">
          <LoadingDots />
        </div>
      )
    }

    return (
      <div
        className={classNames('raw-text--status', {
          'raw-text--error': status.error,
          'raw-text--success': status.success,
          'raw-text--warning': status.warn,
        })}
      >
        <span
          className={classNames('icon', {
            stop: status.error,
            checkmark: status.success,
            'alert-triangle': status.warn,
          })}
        />
        {status.error || status.warn || status.success}
      </div>
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

RawQueryEditor.propTypes = {
  query: string.isRequired,
  onUpdate: func.isRequired,
  config: shape().isRequired,
  templates: arrayOf(
    shape({
      tempVar: string.isRequired,
    })
  ).isRequired,
}

export default RawQueryEditor