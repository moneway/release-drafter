const semver = require('semver')
const moment = require('moment')
const { template } = require('./template')
const log = require('./log')

const splitSemVer = input => {
  const version = semver.inc(input.lastVersion, input.inc, true)

  return {
    ...input,
    version,
    $MAJOR: semver.major(version),
    $MINOR: semver.minor(version),
    $PATCH: semver.patch(version)
  }
}

// NOTE: This is not production ready and is extremly specific to our usecase,
// NOTE: it allows YYYY.0M.0D_MICRO CalVer versioning to work with release-drafter
const lastVersionCalVerIncremented = input => {
  const replacers = {
    $YYYY: moment()
      .utc()
      .format('YYYY'),
    $YY: moment()
      .utc()
      .format('YY'),
    $0M: moment()
      .utc()
      .format('MM'),
    $MM: moment()
      .utc()
      .format('M'),
    $0D: moment()
      .utc()
      .format('DD'),
    $DD: moment()
      .utc()
      .format('D')
  }
  let version = template(input.template, replacers)
  let nextVersion = {
    template: input.template,
    version: version,
    $MAJOR: version,
    ...replacers
  }

  const versionSplit = input.lastVersion.split('_')
  if (versionSplit[0] == version) {
    const lastPatch = Number(versionSplit[1])
    let patch = 1
    if (!isNaN(lastPatch)) {
      patch = lastPatch + 1
    }
    version += '_' + patch
    nextVersion['$PATCH'] = '_' + patch
    nextVersion['template'] = input.template + '$PATCH'
  }

  return {
    $NEXT_CALVER_VERSION: nextVersion,
    $NEXT_MAJOR_VERSION: nextVersion,
    $NEXT_MINOR_VERSION: nextVersion,
    $NEXT_PATCH_VERSION: nextVersion,
    $VERSIONING_SCHEME: 'calver'
  }
}

const isCalVer = template => {
  var calVerSegment = ['$YY', '$YYYY', '$0M', '$MM', '$0D', '$DD']
  return calVerSegment.some(segment => template.includes(segment))
}

const lastVersionSemVerIncremented = input => ({
  $NEXT_MAJOR_VERSION: splitSemVer({ ...input, inc: 'major' }),
  $NEXT_MINOR_VERSION: splitSemVer({ ...input, inc: 'minor' }),
  $NEXT_PATCH_VERSION: splitSemVer({ ...input, inc: 'patch' }),
  $VERSIONING_SCHEME: 'semver'
})

module.exports.getVersionInfo = (lastRelease, template) => {
  if (isCalVer(template)) {
    // Detected Calendar Versioning
    return {
      ...lastVersionCalVerIncremented({
        lastVersion: lastRelease.tag_name,
        template
      })
    }
  } else {
    // Detected Semantic Versioning
    const lastVersion =
      semver.coerce(lastRelease.tag_name) || semver.coerce(lastRelease.name)
    if (!lastVersion) {
      return undefined
    }

    return {
      ...lastVersionSemVerIncremented({
        lastVersion,
        template
      })
    }
  }
}
