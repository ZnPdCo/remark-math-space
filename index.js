import { visit } from 'unist-util-visit';

function is_cn_en(char) {
  if (typeof char === 'undefined') {
    return false;
  }
  let cn =
    /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]/;
  let en = /[0-9A-Za-z]/;
  return cn.test(char) || en.test(char);
}

function toString(node) {
  return (
    node.value ||
    node.alt ||
    node.title ||
    node.url ||
    ('children' in node && all(node.children)) ||
    ('length' in node && all(node)) ||
    ''
  );
}

function all(values) {
  return values.map(toString).join('');
}

function isSpace(node) {
  const s = toString(node);
  return s == ' ' || s == '';
}

function gap(options = {}) {
  const htmlTags = options.tags || []; // e.g. ['kbd', 'var']

  function visitor(node, index, parent, type = {before: true, after: true}) {
    let prevNode, nextNode, cur, offset = 0;
    const nothing = '';

    // Look for previous non-space node
    if (type.before) {
      cur = index - 1;
      while (cur >= 0 && isSpace(parent.children[cur])) cur -= 1;
      prevNode = cur >= 0 ? toString(parent.children[cur]) : nothing;

      if (is_cn_en(prevNode.at(-1))) {
        parent.children.splice(index, 0, { type: 'text', value: ' ' });
        offset = 1;
      }
    }

    // Look for next non-space node
    if (type.after) {
      cur = index + 1;
      while (cur < parent.children.length && isSpace(parent.children[cur])) cur += 1;
      nextNode = cur < parent.children.length ? toString(parent.children[cur]) : nothing;

      if (is_cn_en(nextNode[0])) {
        parent.children.splice(index + 1 + offset, 0, { type: 'text', value: ' ' });
        offset += 1;
      }
    }

    return [visit.SKIP, index + 1 + offset];
  }

  return function (tree) {
    // Built-in node types
    const defaultNodeTypes = ['inlineCode', 'inlineMath', 'strong', 'link'];
    for (const type of defaultNodeTypes) {
      visit(tree, type, visitor);
    }

    // HTML inline tags as raw HTML nodes
    if (htmlTags.length > 0) {
      visit(tree, 'html', (node, index, parent) => {
        const value = node.value.trim();

        // Only match inline tags
        const openTagPattern = new RegExp(
          `^<(${htmlTags.join('|')})(\\s[^>]*)?>$`,
          'i'
        );
        const closeTagPattern = new RegExp(
          `^</(${htmlTags.join('|')})>$`,
          'i'
        );
        if (openTagPattern.test(value)) return visitor(node, index, parent, {before: true, after: false});
        if (closeTagPattern.test(value)) return visitor(node, index, parent, {before: false, after: true});
      });
    }
  };
}

export default gap;
